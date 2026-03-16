use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process;

use uplim_manifest::{format_diagnostics as format_manifest_diagnostics, load_manifest_file};
use uplim_parser::{format_diagnostics as format_parse_diagnostics, parse};

fn print_usage() {
    println!(
        "uplimc\n\nUsage:\n  uplimc check [path]\n  uplimc build [path]\n  uplimc run [path]\n  uplimc test [path]\n  uplimc fmt [path]\n  uplimc lsp\n  uplimc bench [path]\n"
    );
}

fn detect_project_root(target: Option<&str>) -> PathBuf {
    match target {
        Some(value) => {
            let path = PathBuf::from(value);
            if path.is_dir() {
                path
            } else if path.file_name().and_then(|name| name.to_str()) == Some("uplim.toml") {
                path.parent().unwrap_or(Path::new(".")).to_path_buf()
            } else {
                path.parent().unwrap_or(Path::new(".")).to_path_buf()
            }
        }
        None => PathBuf::from("."),
    }
}

fn load_entry_source(project_root: &Path) -> Result<(PathBuf, String), String> {
    let manifest = load_manifest_file(project_root)
        .map_err(|error| format!("Failed to read manifest: {error}"))?;

    if !manifest.diagnostics.is_empty() {
        return Err(format_manifest_diagnostics(&manifest.diagnostics).join("\n"));
    }

    let manifest = manifest
        .manifest
        .ok_or_else(|| "Manifest did not produce a valid configuration.".to_string())?;
    let entry_path = project_root.join(&manifest.build.entry);
    let source = fs::read_to_string(&entry_path)
        .map_err(|error| format!("Failed to read entry {}: {error}", entry_path.display()))?;
    Ok((entry_path, source))
}

fn command_check(target: Option<&str>) -> Result<(), String> {
    let project_root = detect_project_root(target);
    let (entry_path, source) = load_entry_source(&project_root)?;
    let output = parse(&source, &entry_path);
    if !output.diagnostics.is_empty() {
        return Err(format_parse_diagnostics(&output.diagnostics, &entry_path).join("\n"));
    }

    println!("✓ uplimc check");
    println!("  project: {}", project_root.display());
    println!("  entry:   {}", entry_path.display());
    println!(
        "  ast:     {} statement(s)",
        output.program.map(|program| program.statements.len()).unwrap_or(0)
    );
    Ok(())
}

fn placeholder(command: &str) {
    println!(
        "{} is scaffolded in the Rust workspace but not implemented yet. Next phases will add HIR, MIR, borrow checking, and backend lowering.",
        command
    );
}

fn main() {
    let mut args = env::args().skip(1);
    let Some(command) = args.next() else {
        print_usage();
        return;
    };

    let target = args.next();
    let result = match command.as_str() {
        "check" => command_check(target.as_deref()),
        "build" | "run" | "test" | "fmt" | "lsp" | "bench" => {
            placeholder(&command);
            Ok(())
        }
        "--help" | "-h" => {
            print_usage();
            Ok(())
        }
        _ => Err(format!("Unknown command: {}", command)),
    };

    if let Err(message) = result {
        eprintln!("{message}");
        process::exit(1);
    }
}
