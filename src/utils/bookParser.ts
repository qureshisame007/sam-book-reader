import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import { Book, BookFormat } from '../types';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('PDF.js worker setup fallback:', e);
  }
}

// Split large plain text into comfortable, natural pages
export function paginateText(fullText: string, wordsPerPage: number = 320): string[] {
  const paragraphs = fullText.split(/\n\s*\n/);
  const pages: string[] = [];
  let currentPageParagraphs: string[] = [];
  let currentWordCount = 0;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    const words = trimmed.split(/\s+/).length;

    if (currentWordCount + words > wordsPerPage && currentPageParagraphs.length > 0) {
      pages.push(currentPageParagraphs.join('\n\n'));
      currentPageParagraphs = [trimmed];
      currentWordCount = words;
    } else {
      currentPageParagraphs.push(trimmed);
      currentWordCount += words;
    }
  }

  if (currentPageParagraphs.length > 0) {
    pages.push(currentPageParagraphs.join('\n\n'));
  }

  return pages.length > 0 ? pages : ['(Empty document)'];
}

// Parse TXT File
export async function parseTxtFile(file: File): Promise<Book> {
  const text = await file.text();
  const pages = paginateText(text);

  let title = file.name.replace(/\.[^/.]+$/, '');
  let author = 'Unknown Author';

  // Try extracting title/author if top lines resemble Title / Author format
  const firstLines = text.slice(0, 500).split('\n').map(l => l.trim()).filter(Boolean);
  if (firstLines.length > 0 && firstLines[0].length < 80) {
    if (firstLines[0].toLowerCase().startsWith('title:')) {
      title = firstLines[0].replace(/^title:\s*/i, '').trim();
    }
  }
  if (firstLines.length > 1 && firstLines[1].toLowerCase().startsWith('author:')) {
    author = firstLines[1].replace(/^author:\s*/i, '').trim();
  }

  return {
    id: `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    author,
    format: 'txt',
    totalPages: pages.length,
    currentPage: 1,
    bookmarks: [],
    dateAdded: Date.now(),
    fileSize: file.size,
    pages,
  };
}

// Helper to strip HTML tags cleanly and keep paragraph breaks
function cleanHtmlContent(htmlStr: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlStr, 'text/html');

  // Remove scripts, styles, svg
  const removeElements = doc.querySelectorAll('script, style, head, svg');
  removeElements.forEach(el => el.remove());

  // Extract block elements
  const blocks = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, blockquote, div');
  const paragraphs: string[] = [];

  if (blocks.length > 0) {
    blocks.forEach(block => {
      const text = block.textContent?.trim();
      if (text && text.length > 0) {
        paragraphs.push(text);
      }
    });
  } else {
    const raw = doc.body.textContent || '';
    return raw.trim();
  }

  return paragraphs.join('\n\n');
}

// Parse EPUB File
export async function parseEpubFile(file: File): Promise<Book> {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);

  // 1. Find META-INF/container.xml
  let opfPath = '';
  const containerFile = zipContent.file('META-INF/container.xml');
  if (containerFile) {
    const containerXml = await containerFile.async('text');
    const parser = new DOMParser();
    const doc = parser.parseFromString(containerXml, 'application/xml');
    const rootfile = doc.querySelector('rootfile');
    if (rootfile) {
      opfPath = rootfile.getAttribute('full-path') || '';
    }
  }

  if (!opfPath) {
    // Fallback: look for any .opf file
    const opfEntry = Object.keys(zipContent.files).find(name => name.endsWith('.opf'));
    if (opfEntry) opfPath = opfEntry;
  }

  let title = file.name.replace(/\.[^/.]+$/, '');
  let author = 'Unknown Author';
  let coverDataUrl: string | undefined = undefined;
  const rawSections: string[] = [];

  if (opfPath && zipContent.file(opfPath)) {
    const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
    const opfXml = await zipContent.file(opfPath)!.async('text');
    const parser = new DOMParser();
    const doc = parser.parseFromString(opfXml, 'application/xml');

    // Metadata
    const titleEl = doc.querySelector('title, metadata > title, dc\\:title');
    if (titleEl?.textContent) title = titleEl.textContent.trim();

    const creatorEl = doc.querySelector('creator, metadata > creator, dc\\:creator');
    if (creatorEl?.textContent) author = creatorEl.textContent.trim();

    // Manifest items
    const manifestItems = new Map<string, { href: string; mediaType: string }>();
    doc.querySelectorAll('manifest > item').forEach(item => {
      const id = item.getAttribute('id');
      const href = item.getAttribute('href');
      const mediaType = item.getAttribute('media-type') || '';
      if (id && href) {
        manifestItems.set(id, { href, mediaType });
      }
    });

    // Check for cover
    let coverHref = '';
    const metaCover = doc.querySelector('meta[name="cover"]');
    if (metaCover) {
      const coverId = metaCover.getAttribute('content');
      if (coverId && manifestItems.has(coverId)) {
        coverHref = manifestItems.get(coverId)!.href;
      }
    }
    if (!coverHref) {
      for (const [_, item] of manifestItems.entries()) {
        if (item.href.toLowerCase().includes('cover') && item.mediaType.startsWith('image/')) {
          coverHref = item.href;
          break;
        }
      }
    }

    if (coverHref) {
      const fullCoverPath = opfDir + coverHref;
      const coverFile = zipContent.file(fullCoverPath) || zipContent.file(coverHref);
      if (coverFile) {
        try {
          const blob = await coverFile.async('blob');
          coverDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn('Could not load cover:', e);
        }
      }
    }

    // Spine reading order
    const spineItems = doc.querySelectorAll('spine > itemref');
    for (let i = 0; i < spineItems.length; i++) {
      const idref = spineItems[i].getAttribute('idref');
      if (idref && manifestItems.has(idref)) {
        const { href } = manifestItems.get(idref)!;
        const sectionPath = opfDir + href;
        const sectionFile = zipContent.file(sectionPath) || zipContent.file(href);
        if (sectionFile) {
          const html = await sectionFile.async('text');
          const cleanText = cleanHtmlContent(html);
          if (cleanText.length > 0) {
            rawSections.push(cleanText);
          }
        }
      }
    }
  }

  // If spine parsing didn't find sections, fallback to all xhtml/html files in zip
  if (rawSections.length === 0) {
    const htmlFiles = Object.keys(zipContent.files).filter(name => 
      (name.endsWith('.html') || name.endsWith('.xhtml') || name.endsWith('.htm')) && !name.includes('toc')
    );
    htmlFiles.sort();
    for (const name of htmlFiles) {
      const html = await zipContent.file(name)!.async('text');
      const clean = cleanHtmlContent(html);
      if (clean.length > 0) {
        rawSections.push(clean);
      }
    }
  }

  // Combine and paginate
  const fullText = rawSections.join('\n\n');
  const pages = paginateText(fullText.length > 0 ? fullText : 'No readable text found in EPUB.');

  return {
    id: `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    author,
    format: 'epub',
    coverDataUrl,
    totalPages: pages.length,
    currentPage: 1,
    bookmarks: [],
    dateAdded: Date.now(),
    fileSize: file.size,
    pages,
  };
}

// Parse PDF File
export async function parsePdfFile(file: File): Promise<Book> {
  const arrayBuffer = await file.arrayBuffer();
  const typedArray = new Uint8Array(arrayBuffer);

  const loadingTask = pdfjsLib.getDocument({ data: typedArray });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  const pages: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const textItems = textContent.items.map((item: any) => item.str || '').filter(Boolean);
      const pageText = textItems.join(' ');
      pages.push(pageText.trim() || `[Page ${i} - Graphical content]`);
    } catch (e) {
      pages.push(`[Page ${i}]`);
    }
  }

  let title = file.name.replace(/\.[^/.]+$/, '');
  let author = 'Unknown Author';

  try {
    const metadata = await pdf.getMetadata();
    const info = metadata?.info as any;
    if (info?.Title && typeof info.Title === 'string' && info.Title.trim()) {
      title = info.Title.trim();
    }
    if (info?.Author && typeof info.Author === 'string' && info.Author.trim()) {
      author = info.Author.trim();
    }
  } catch (e) {
    // Keep file name fallback
  }

  return {
    id: `book_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    author,
    format: 'pdf',
    totalPages: pages.length,
    currentPage: 1,
    bookmarks: [],
    dateAdded: Date.now(),
    fileSize: file.size,
    pages,
  };
}

// Master book parser function
export async function parseBookFile(file: File): Promise<Book> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'epub') {
    return parseEpubFile(file);
  } else if (ext === 'pdf') {
    return parsePdfFile(file);
  } else if (ext === 'txt') {
    return parseTxtFile(file);
  } else {
    throw new Error('Unsupported format. Please select an EPUB, PDF, or TXT file.');
  }
}

// Pre-loaded sample classics for instant enjoyment
export const SAMPLE_BOOKS: Book[] = [
  {
    id: 'sample_sherlock',
    title: 'A Scandal in Bohemia',
    author: 'Arthur Conan Doyle',
    format: 'epub',
    totalPages: 8,
    currentPage: 1,
    bookmarks: [],
    dateAdded: Date.now() - 86400000 * 2,
    pages: [
      `I.\n\nTo Sherlock Holmes she is always the woman. I have seldom heard him mention her under any other name. In his eyes she obscures and predominates the whole of her sex. It was not that he felt any emotion akin to love for Irene Adler. All emotions, and that one particularly, were abhorrent to his cold, precise but admirably balanced mind.\n\nHe was, I take it, the most perfect reasoning and observing machine that the world has seen, but as a lover he would have placed himself in a false position. He never spoke of the softer passions, save with a gibe and a sneer. They were admirable things for the observer—excellent for drawing the veil from men’s motives and actions.\n\nAnd yet there was but one woman to him, and that woman was the late Irene Adler, of dubious and questionable memory.`,
      `I had seen little of Holmes lately. My marriage had drifted us away from each other. My own complete happiness, and the home-centred interests which rise up around the man who first finds himself master of his own establishment, were sufficient to absorb all my attention.\n\nHolmes, who loathed every form of society with his whole Bohemian soul, remained in our lodgings in Baker Street, buried among his old books, and alternating from week to week between cocaine and ambition, the drowsiness of the drug, and the fierce energy of his own keen nature.\n\nHe was still, as ever, deeply attracted by the study of crime, and occupied his immense faculties and extraordinary powers of observation in following out those clues, and clearing up those mysteries which had been abandoned as hopeless by the official police.`,
      `One night—it was on the twentieth of March, 1888—I was returning from a journey to a patient (for I had now returned to civil practice), when my way led me through Baker Street.\n\nAs I passed the well-remembered door, which must always be associated in my mind with my wooing, and with the dark incidents of the Study in Scarlet, I was seized with a keen desire to see Holmes again, and to know how he was employing his extraordinary powers.\n\nHis rooms were brilliantly lit, and, even as I looked up, I saw his tall, spare figure pass twice in a dark silhouette against the blind. He was pacing the room swiftly, eagerly, with his head sunk upon his chest and his hands clasped behind him. To me, who knew his every mood and habit, his attitude and manner told their own story. He was at work again.`,
      `He had risen out of his drug-created dreams and was hot upon the scent of some new problem. I rang the bell and was shown up to the chamber which had formerly been in part my own.\n\nHis manner was not effusive. It seldom was; but he was glad, I think, to see me. With hardly a word spoken, but with a kindly eye, he waved me to an armchair, threw across his case of cigars, and indicated an acid flask and a gasogene in the corner.\n\nThen he stood before the fire and looked me over in his singular introspective fashion.\n\n"Wedlock suits you," he remarked. "I think, Watson, that you have put on seven and a half pounds since I saw you."\n\n"Seven!" I answered.\n\n"Indeed, I should have thought a little more. Just a trifle more, I fancy, Watson. And in practice again, I observe. You did not tell me that you intended to go into harness."`,
      `"Then, how do you know?"\n\n"I see it, I deduce it. How do I know that you have been getting yourself very wet lately, and that you have a most clumsy and careless servant girl?"\n\n"My dear Holmes," said I, "this is too much. You would certainly have been burned, had you lived a few centuries ago. It is true that I had a country walk on Thursday and came home in a dreadful mess, but as I have changed my clothes I can't imagine how you deduce it. As to Mary Jane, she is incorrigible, and my wife has given her notice; but there, again, I fail to see how you work it out."\n\nHe chuckled to himself and rubbed his long, nervous hands together.`,
      `"It is simplicity itself," said he; "my eyes tell me that on the inside of your left shoe, just where the firelight strikes it, the leather is scored by six almost parallel cuts. Obviously they have been caused by someone who has very carelessly scraped round the edges of the sole in order to remove crusted mud from it. Hence, you see, my double deduction that you had been out in vile weather, and that you had a particularly malignant boot-slitting specimen of the London slavey.\n\nAs to your practice, if a gentleman walks into my rooms smelling of iodoform, with a black mark of nitrate of silver upon his right forefinger, and a bulge on the right side of his top-hat to show where he has secreted his stethoscope, I must be dull indeed, if I do not pronounce him to be an active member of the medical profession."`,
      `I could not help laughing at the ease with which he explained his process of deduction.\n\n"When I hear you give your reasons," I remarked, "the thing always appears to me to be so ridiculously simple that I could easily do it myself, though at each successive instance of your reasoning I am baffled until you explain your process. And yet I believe that my eyes are as good as yours."\n\n"Quite so," he answered, lighting a cigarette, and throwing himself down into an armchair. "You see, but you do not observe. The distinction is clear. For example, you have frequently seen the steps which lead up from the hall to this room."\n\n"Frequently."\n\n"How often?"\n\n"Well, some hundreds of times."\n\n"Then how many are there?"\n\n"How many? I don't know."\n\n"Quite so! You have not observed. And yet you have seen. That is just my point. Now, I know that there are seventeen steps, because I have both seen and observed."`,
      `"By the way, since you are interested in these little problems, and since you are good enough to chronicle one or two of my trifling experiences, you may be interested in this."\n\nHe threw over a sheet of thick, pink-tinted notepaper which had been lying open upon the table.\n\n"It came by the last post," said he. "Read it aloud."\n\nThe note was undated, and without either signature or address.\n\n"There will call upon you to-night, at a quarter to eight o’clock," it said, "a gentleman who desires to consult you upon a matter of the very deepest moment. Your recent services to one of the royal houses of Europe have shown that you are one who may safely be trusted with matters which are of an importance which can hardly be exaggerated. This account of you we have from all quarters received. Be in your chamber then at that hour, and do not take it amiss if your visitor wear a mask."`
    ]
  },
  {
    id: 'sample_pride',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    format: 'txt',
    totalPages: 6,
    currentPage: 1,
    bookmarks: [],
    dateAdded: Date.now() - 86400000,
    pages: [
      `CHAPTER I.\n\nIt is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.\n\nHowever little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.\n\n"My dear Mr. Bennet," said his lady to him one day, "have you heard that Netherfield Park is let at last?"\n\nMr. Bennet replied that he had not.\n\n"But it is," returned she; "for Mrs. Long has just been here, and she told me all about it."\n\nMr. Bennet made no answer.`,
      `"Do you not want to know who has taken it?" cried his wife impatiently.\n\n"You want to tell me, and I have no objection to hearing it."\n\nThis was invitation enough.\n\n"Why, my dear, you must know, Mrs. Long says that Netherfield is taken by a young man of large fortune from the north of England; that he came down on Monday in a chaise and four to see the place, and was so much delighted with it, that he agreed with Mr. Morris immediately; that he is to take possession before Michaelmas, and some of his servants are to be in the house by the end of next week."\n\n"What is his name?"\n\n"Bingley."\n\n"Is he married or single?"\n\n"Oh! Single, my dear, to be sure! A single man of large fortune; four or five thousand a year. What a fine thing for our girls!"`,
      `"How so? How can it affect them?"\n\n"My dear Mr. Bennet," replied his wife, "how can you be so tiresome! You must know that I am thinking of his marrying one of them."\n\n"Is that his design in settling here?"\n\n"Design! Nonsense, how can you talk so! But it is very likely that he may fall in love with one of them, and therefore you must visit him as soon as he comes."\n\n"I see no occasion for that. You and the girls may go, or you may send them by themselves, which perhaps will be still better, for as you are as handsome as any of them, Mr. Bingley may like you the best of the party."\n\n"My dear, you flatter me. I certainly have had my share of beauty, but I do not pretend to be anything extraordinary now. When a woman has five grown-up daughters, she ought to give over thinking of her own beauty."`,
      `"In such cases, a woman has not often much beauty to think of."\n\n"But, my dear, you must indeed go and see Mr. Bingley when he comes into the neighbourhood."\n\n"It is more than I engage for, I assure you."\n\n"But consider your daughters. Only think what an establishment it would be for one of them. Sir William and Lady Lucas are determined to go, merely on that account, for in general, you know, they visit no newcomers. Indeed you must go, for it will be impossible for us to visit him if you do not."\n\n"You are over-scrupulous, surely. I dare say Mr. Bingley will be very glad to see you; and I will send a few lines by you to assure him of my hearty consent to his marrying whichever he chooses of the girls; though I must throw in a good word for my little Lizzy."`,
      `"I desire you will do no such thing. Lizzy is not a bit better than the others; and I am sure she is not half so handsome as Jane, nor half so good-humoured as Lydia. But you are always giving her the preference."\n\n"They have none of them much to recommend them," replied he; "they are all silly and ignorant like other girls; but Lizzy has something more of quickness than her sisters."\n\n"Mr. Bennet, how can you abuse your own children in such a way? You take delight in vexing me. You have no compassion for my poor nerves."\n\n"You mistake me, my dear. I have a high respect for your nerves. They are my old friends. I have heard you mention them with consideration these last twenty years at least."\n\n"Ah, you do not know what I suffer!"\n\n"But I hope you will get over it, and live to see many young men of four thousand a year come into the neighbourhood."`,
      `"It will be no use to us, if twenty such should come, since you will not visit them."\n\n"Depend upon it, my dear, that when there are twenty, I will visit them all."\n\nMr. Bennet was so odd a mixture of quick parts, sarcastic humour, reserve, and caprice, that the experience of three-and-twenty years had been insufficient to make his wife understand his character. Her mind was less difficult to develop. She was a woman of mean understanding, little information, and uncertain temper. When she was discontented, she fancied herself nervous. The business of her life was to get her daughters married; its solace was visiting and news.`
    ]
  }
];
