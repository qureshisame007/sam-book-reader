fn main() {
    #[cfg(target_os = "windows")]
    {
        use std::path::Path;
        let icon_path = Path::new("../icons/icon.ico");
        
        // Only fail if icon doesn't exist
        if !icon_path.exists() {
            println!("cargo:warning=Icon file not found at {:?}, using default", icon_path);
            // Don't panic - allow build to continue
            return;
        }
    }
    
    tauri_build::build()
}
