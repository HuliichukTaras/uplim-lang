use std::collections::BTreeMap;
use std::fmt;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SourceLocation {
    pub file: PathBuf,
    pub line: usize,
    pub column: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Severity {
    Warning,
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ManifestDiagnostic {
    pub code: &'static str,
    pub message: String,
    pub severity: Severity,
    pub location: SourceLocation,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Profile {
    WasmComponent,
    WasmModuleDev,
    JsInterop,
    NativeLlvm,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Edition {
    V1,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AiProvider {
    OpenAi,
    Anthropic,
    Ollama,
    Custom,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AiMode {
    Structured,
    Text,
    Tooling,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PackageConfig {
    pub name: String,
    pub version: String,
    pub edition: Edition,
    pub description: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BuildConfig {
    pub entry: String,
    pub profile: Profile,
    pub output: String,
    pub app_root: Option<String>,
    pub module_roots: Vec<String>,
    pub test_roots: Vec<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct CapabilitiesConfig {
    pub filesystem_read: bool,
    pub filesystem_write: bool,
    pub network_client: bool,
    pub network_server: bool,
    pub clock_wall: bool,
    pub clock_monotonic: bool,
    pub env_read: bool,
    pub process_spawn: bool,
    pub ai_remote: bool,
    pub ai_local: bool,
    pub ai_embedding: bool,
    pub ai_tool_call: bool,
    pub mcp_client: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct AiConfig {
    pub provider: AiProvider,
    pub model: String,
    pub mode: AiMode,
    pub allow_tool_calls: bool,
    pub allow_mcp: bool,
    pub temperature: Option<f64>,
    pub endpoint: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct FeaturesConfig {
    pub default: Vec<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Manifest {
    pub package: PackageConfig,
    pub build: BuildConfig,
    pub capabilities: CapabilitiesConfig,
    pub ai: Option<AiConfig>,
    pub features: FeaturesConfig,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ParsedManifest {
    pub manifest: Option<Manifest>,
    pub diagnostics: Vec<ManifestDiagnostic>,
}

#[derive(Debug, Clone, PartialEq)]
enum ScalarValue {
    String(String),
    Boolean(bool),
    Number(f64),
    StringArray(Vec<String>),
}

type Table = BTreeMap<String, ScalarValue>;
type Document = BTreeMap<String, Table>;

fn diagnostic(
    file: &Path,
    line: usize,
    column: usize,
    code: &'static str,
    message: impl Into<String>,
) -> ManifestDiagnostic {
    ManifestDiagnostic {
        code,
        message: message.into(),
        severity: Severity::Error,
        location: SourceLocation {
            file: file.to_path_buf(),
            line,
            column,
        },
    }
}

fn strip_comment(line: &str) -> String {
    let mut in_string = false;
    let mut escaped = false;
    for (index, ch) in line.char_indices() {
        if escaped {
            escaped = false;
            continue;
        }
        if ch == '\\' {
            escaped = true;
            continue;
        }
        if ch == '"' {
            in_string = !in_string;
            continue;
        }
        if ch == '#' && !in_string {
            return line[..index].to_string();
        }
    }
    line.to_string()
}

fn parse_quoted_string(raw: &str) -> Option<String> {
    if !(raw.starts_with('"') && raw.ends_with('"')) {
        return None;
    }
    let inner = &raw[1..raw.len() - 1];
    let mut output = String::new();
    let mut escaped = false;
    for ch in inner.chars() {
        if escaped {
            match ch {
                '\\' => output.push('\\'),
                '"' => output.push('"'),
                'n' => output.push('\n'),
                't' => output.push('\t'),
                _ => return None,
            }
            escaped = false;
            continue;
        }
        if ch == '\\' {
            escaped = true;
            continue;
        }
        output.push(ch);
    }
    if escaped {
        return None;
    }
    Some(output)
}

fn parse_string_array(raw: &str) -> Option<Vec<String>> {
    if !(raw.starts_with('[') && raw.ends_with(']')) {
        return None;
    }
    let inner = raw[1..raw.len() - 1].trim();
    if inner.is_empty() {
        return Some(Vec::new());
    }

    let mut values = Vec::new();
    let mut current = String::new();
    let mut in_string = false;
    let mut escaped = false;

    for ch in inner.chars() {
        if escaped {
            current.push(ch);
            escaped = false;
            continue;
        }
        if ch == '\\' {
            current.push(ch);
            escaped = true;
            continue;
        }
        if ch == '"' {
            in_string = !in_string;
            current.push(ch);
            continue;
        }
        if ch == ',' && !in_string {
            values.push(current.trim().to_string());
            current.clear();
            continue;
        }
        current.push(ch);
    }

    if !current.trim().is_empty() {
        values.push(current.trim().to_string());
    }

    values
        .into_iter()
        .map(|item| parse_quoted_string(&item))
        .collect()
}

fn parse_value(raw: &str) -> Option<ScalarValue> {
    let value = raw.trim();
    if let Some(string) = parse_quoted_string(value) {
        return Some(ScalarValue::String(string));
    }
    match value {
        "true" => return Some(ScalarValue::Boolean(true)),
        "false" => return Some(ScalarValue::Boolean(false)),
        _ => {}
    }
    if let Some(values) = parse_string_array(value) {
        return Some(ScalarValue::StringArray(values));
    }
    if let Ok(number) = value.parse::<f64>() {
        return Some(ScalarValue::Number(number));
    }
    None
}

fn get_string(table: &Table, key: &str) -> Option<String> {
    match table.get(key) {
        Some(ScalarValue::String(value)) => Some(value.clone()),
        _ => None,
    }
}

fn get_bool(table: &Table, key: &str) -> bool {
    match table.get(key) {
        Some(ScalarValue::Boolean(value)) => *value,
        _ => false,
    }
}

fn get_string_array(table: &Table, key: &str) -> Vec<String> {
    match table.get(key) {
        Some(ScalarValue::StringArray(values)) => values.clone(),
        _ => Vec::new(),
    }
}

fn get_number(table: &Table, key: &str) -> Option<f64> {
    match table.get(key) {
        Some(ScalarValue::Number(value)) => Some(*value),
        _ => None,
    }
}

fn parse_profile(value: &str) -> Option<Profile> {
    match value {
        "wasm-component" => Some(Profile::WasmComponent),
        "wasm-module-dev" => Some(Profile::WasmModuleDev),
        "js-interop" => Some(Profile::JsInterop),
        "native-llvm" => Some(Profile::NativeLlvm),
        _ => None,
    }
}

fn parse_edition(value: &str) -> Option<Edition> {
    match value {
        "v1" => Some(Edition::V1),
        _ => None,
    }
}

fn parse_ai_provider(value: &str) -> Option<AiProvider> {
    match value {
        "openai" => Some(AiProvider::OpenAi),
        "anthropic" => Some(AiProvider::Anthropic),
        "ollama" => Some(AiProvider::Ollama),
        "custom" => Some(AiProvider::Custom),
        _ => None,
    }
}

fn parse_ai_mode(value: &str) -> Option<AiMode> {
    match value {
        "structured" => Some(AiMode::Structured),
        "text" => Some(AiMode::Text),
        "tooling" => Some(AiMode::Tooling),
        _ => None,
    }
}

fn validate_manifest(doc: &Document, file: &Path) -> ParsedManifest {
    let mut diagnostics = Vec::new();

    let package = match doc.get("package") {
        Some(table) => table,
        None => {
            diagnostics.push(diagnostic(file, 1, 1, "MANIFEST_MISSING_PACKAGE", "Missing required [package] section."));
            return ParsedManifest { manifest: None, diagnostics };
        }
    };
    let build = match doc.get("build") {
        Some(table) => table,
        None => {
            diagnostics.push(diagnostic(file, 1, 1, "MANIFEST_MISSING_BUILD", "Missing required [build] section."));
            return ParsedManifest { manifest: None, diagnostics };
        }
    };
    let capabilities = match doc.get("capabilities") {
        Some(table) => table,
        None => {
            diagnostics.push(diagnostic(file, 1, 1, "MANIFEST_MISSING_CAPABILITIES", "Missing required [capabilities] section."));
            return ParsedManifest { manifest: None, diagnostics };
        }
    };

    let package_name = get_string(package, "name").unwrap_or_default();
    if !package_name
        .chars()
        .enumerate()
        .all(|(index, ch)| {
            if index == 0 {
                ch.is_ascii_lowercase()
            } else {
                ch.is_ascii_lowercase() || ch.is_ascii_digit() || ch == '_' || ch == '-'
            }
        })
    {
        diagnostics.push(diagnostic(file, 1, 1, "MANIFEST_INVALID_PACKAGE_NAME", "Package name must match ^[a-z][a-z0-9_-]*$."));
    }

    let package_version = get_string(package, "version").unwrap_or_default();
    let version_segments: Vec<_> = package_version.split('.').collect();
    if version_segments.len() < 3 || version_segments.iter().any(|segment| segment.is_empty()) {
        diagnostics.push(diagnostic(file, 1, 1, "MANIFEST_INVALID_PACKAGE_VERSION", "Package version must look like semver, for example 0.1.0."));
    }

    let edition = get_string(package, "edition")
        .and_then(|value| parse_edition(&value));
    if edition.is_none() {
        diagnostics.push(diagnostic(file, 1, 1, "MANIFEST_INVALID_EDITION", "Edition must be \"v1\"."));
    }

    let entry = get_string(build, "entry").unwrap_or_default();
    if !entry.ends_with(".upl") {
        diagnostics.push(diagnostic(file, 1, 1, "MANIFEST_INVALID_ENTRY", "Build entry must end with .upl."));
    }

    let output = get_string(build, "output").unwrap_or_default();
    if output.trim().is_empty() {
        diagnostics.push(diagnostic(file, 1, 1, "MANIFEST_INVALID_OUTPUT", "Build output must not be empty."));
    }

    let profile = get_string(build, "profile")
        .and_then(|value| parse_profile(&value));
    if profile.is_none() {
        diagnostics.push(diagnostic(file, 1, 1, "MANIFEST_INVALID_PROFILE", "Build profile must be one of wasm-component, wasm-module-dev, js-interop, native-llvm."));
    }

    let capabilities_config = CapabilitiesConfig {
        filesystem_read: get_bool(capabilities, "filesystem_read"),
        filesystem_write: get_bool(capabilities, "filesystem_write"),
        network_client: get_bool(capabilities, "network_client"),
        network_server: get_bool(capabilities, "network_server"),
        clock_wall: get_bool(capabilities, "clock_wall"),
        clock_monotonic: get_bool(capabilities, "clock_monotonic"),
        env_read: get_bool(capabilities, "env_read"),
        process_spawn: get_bool(capabilities, "process_spawn"),
        ai_remote: get_bool(capabilities, "ai_remote"),
        ai_local: get_bool(capabilities, "ai_local"),
        ai_embedding: get_bool(capabilities, "ai_embedding"),
        ai_tool_call: get_bool(capabilities, "ai_tool_call"),
        mcp_client: get_bool(capabilities, "mcp_client"),
    };

    let ai = doc.get("ai").map(|table| {
        let provider = get_string(table, "provider").and_then(|value| parse_ai_provider(&value));
        if provider.is_none() {
            diagnostics.push(diagnostic(file, 1, 1, "MANIFEST_INVALID_AI_PROVIDER", "AI provider must be one of openai, anthropic, ollama, custom."));
        }

        let model = get_string(table, "model").unwrap_or_default();
        if model.trim().is_empty() {
            diagnostics.push(diagnostic(file, 1, 1, "MANIFEST_INVALID_AI_MODEL", "AI model must not be empty."));
        }

        let mode = get_string(table, "mode").and_then(|value| parse_ai_mode(&value));
        if mode.is_none() {
            diagnostics.push(diagnostic(file, 1, 1, "MANIFEST_INVALID_AI_MODE", "AI mode must be one of structured, text, tooling."));
        }

        let temperature = get_number(table, "temperature");
        if let Some(value) = temperature {
            if !(0.0..=2.0).contains(&value) {
                diagnostics.push(diagnostic(file, 1, 1, "MANIFEST_INVALID_AI_TEMPERATURE", "AI temperature must be between 0 and 2."));
            }
        }

        AiConfig {
            provider: provider.unwrap_or(AiProvider::Custom),
            model,
            mode: mode.unwrap_or(AiMode::Structured),
            allow_tool_calls: get_bool(table, "allow_tool_calls"),
            allow_mcp: get_bool(table, "allow_mcp"),
            temperature,
            endpoint: get_string(table, "endpoint"),
        }
    });

    if capabilities_config.ai_remote {
        if ai.is_none() {
            diagnostics.push(diagnostic(file, 1, 1, "MANIFEST_AI_SECTION_REQUIRED", "AI configuration is required when ai_remote is enabled."));
        }
        if !capabilities_config.network_client {
            diagnostics.push(diagnostic(file, 1, 1, "MANIFEST_NETWORK_CLIENT_REQUIRED", "ai_remote requires network_client capability."));
        }
    }

    if capabilities_config.ai_tool_call && !ai.as_ref().map(|cfg| cfg.allow_tool_calls).unwrap_or(false) {
        diagnostics.push(diagnostic(file, 1, 1, "MANIFEST_AI_TOOL_CALL_REQUIRED", "ai_tool_call requires ai.allow_tool_calls = true."));
    }

    if capabilities_config.mcp_client && !ai.as_ref().map(|cfg| cfg.allow_mcp).unwrap_or(false) {
        diagnostics.push(diagnostic(file, 1, 1, "MANIFEST_MCP_REQUIRED", "mcp_client requires ai.allow_mcp = true."));
    }

    if diagnostics.iter().any(|diag| diag.severity == Severity::Error) {
        return ParsedManifest { manifest: None, diagnostics };
    }

    ParsedManifest {
        manifest: Some(Manifest {
            package: PackageConfig {
                name: package_name,
                version: package_version,
                edition: edition.unwrap_or(Edition::V1),
                description: get_string(package, "description"),
            },
            build: BuildConfig {
                entry,
                profile: profile.unwrap_or(Profile::JsInterop),
                output,
                app_root: get_string(build, "app_root"),
                module_roots: get_string_array(build, "module_roots"),
                test_roots: get_string_array(build, "test_roots"),
            },
            capabilities: capabilities_config,
            ai,
            features: FeaturesConfig {
                default: doc
                    .get("features")
                    .map(|table| get_string_array(table, "default"))
                    .unwrap_or_default(),
            },
        }),
        diagnostics,
    }
}

pub fn parse_manifest_str(content: &str, file: impl AsRef<Path>) -> ParsedManifest {
    let file = file.as_ref();
    let mut current_section: Option<String> = None;
    let mut doc: Document = BTreeMap::new();
    let mut diagnostics = Vec::new();

    for (index, raw_line) in content.lines().enumerate() {
        let line_number = index + 1;
        let line = strip_comment(raw_line);
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        if trimmed.starts_with('[') && trimmed.ends_with(']') {
            let name = &trimmed[1..trimmed.len() - 1];
            current_section = Some(name.to_string());
            doc.entry(name.to_string()).or_default();
            continue;
        }

        let section = match &current_section {
            Some(section) => section.clone(),
            None => {
                diagnostics.push(diagnostic(file, line_number, 1, "MANIFEST_SECTION_REQUIRED", "Key-value pairs must appear inside a named table section."));
                continue;
            }
        };

        let Some(eq_index) = trimmed.find('=') else {
            diagnostics.push(diagnostic(file, line_number, 1, "MANIFEST_INVALID_ASSIGNMENT", "Expected a key = value assignment."));
            continue;
        };

        let key = trimmed[..eq_index].trim();
        let value = trimmed[eq_index + 1..].trim();
        if key.is_empty() {
            diagnostics.push(diagnostic(file, line_number, 1, "MANIFEST_EMPTY_KEY", "Manifest key must not be empty."));
            continue;
        }
        let Some(parsed) = parse_value(value) else {
            diagnostics.push(diagnostic(file, line_number, eq_index + 1, "MANIFEST_INVALID_VALUE", format!("Unsupported TOML value for key \"{}\".", key)));
            continue;
        };

        doc.entry(section).or_default().insert(key.to_string(), parsed);
    }

    if diagnostics.iter().any(|diag| diag.severity == Severity::Error) {
        return ParsedManifest { manifest: None, diagnostics };
    }

    validate_manifest(&doc, file)
}

pub fn load_manifest_file(target: impl AsRef<Path>) -> std::io::Result<ParsedManifest> {
    let target = target.as_ref();
    let manifest_path = if target.is_dir() {
        target.join("uplim.toml")
    } else {
        target.to_path_buf()
    };
    let content = fs::read_to_string(&manifest_path)?;
    Ok(parse_manifest_str(&content, manifest_path))
}

pub fn format_diagnostics(diagnostics: &[ManifestDiagnostic]) -> Vec<String> {
    diagnostics
        .iter()
        .map(|diag| {
            format!(
                "{}:{}:{} [{}] {}",
                diag.location.file.display(),
                diag.location.line,
                diag.location.column,
                diag.code,
                diag.message
            )
        })
        .collect()
}

impl fmt::Display for Profile {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let value = match self {
            Profile::WasmComponent => "wasm-component",
            Profile::WasmModuleDev => "wasm-module-dev",
            Profile::JsInterop => "js-interop",
            Profile::NativeLlvm => "native-llvm",
        };
        write!(f, "{value}")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const VALID_MANIFEST: &str = r#"
[package]
name = "uplim-demo"
version = "0.1.0"
edition = "v1"

[build]
entry = "app/main.upl"
profile = "wasm-component"
output = "dist"
app_root = "app"
module_roots = ["modules", "components"]
test_roots = ["tests"]

[capabilities]
network_client = true
network_server = true
ai_remote = true
ai_tool_call = true
mcp_client = true

[ai]
provider = "openai"
model = "gpt-4o-mini"
mode = "structured"
allow_tool_calls = true
allow_mcp = true
temperature = 0.2
"#;

    #[test]
    fn parses_valid_manifest() {
        let parsed = parse_manifest_str(VALID_MANIFEST, "uplim.toml");
        assert!(parsed.diagnostics.is_empty());
        let manifest = parsed.manifest.expect("manifest");
        assert_eq!(manifest.package.name, "uplim-demo");
        assert_eq!(manifest.build.entry, "app/main.upl");
        assert_eq!(manifest.build.profile, Profile::WasmComponent);
        assert!(manifest.capabilities.ai_remote);
        assert_eq!(manifest.ai.expect("ai").model, "gpt-4o-mini");
    }

    #[test]
    fn rejects_invalid_manifest() {
        let parsed = parse_manifest_str(
            r#"
[package]
name = "UPLim"
version = "0.1"
edition = "v2"

[build]
entry = "main.ts"
profile = "native"
output = ""

[capabilities]
ai_remote = true
ai_tool_call = true
mcp_client = true
"#,
            "uplim.toml",
        );

        assert!(parsed.manifest.is_none());
        let codes: Vec<_> = parsed.diagnostics.iter().map(|diag| diag.code).collect();
        assert!(codes.contains(&"MANIFEST_INVALID_PACKAGE_NAME"));
        assert!(codes.contains(&"MANIFEST_INVALID_PACKAGE_VERSION"));
        assert!(codes.contains(&"MANIFEST_INVALID_EDITION"));
        assert!(codes.contains(&"MANIFEST_INVALID_ENTRY"));
        assert!(codes.contains(&"MANIFEST_INVALID_PROFILE"));
        assert!(codes.contains(&"MANIFEST_AI_SECTION_REQUIRED"));
        assert!(codes.contains(&"MANIFEST_NETWORK_CLIENT_REQUIRED"));
        assert!(codes.contains(&"MANIFEST_AI_TOOL_CALL_REQUIRED"));
        assert!(codes.contains(&"MANIFEST_MCP_REQUIRED"));
    }
}
