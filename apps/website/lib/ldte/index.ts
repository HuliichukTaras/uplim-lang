/**
 * Light Digital Trail Engine (LDTE) - Central Exports
 * 
 * GDPR-safe passive viral presence system.
 * Creates public artifacts from user actions without tracking.
 */

// Artifact generation
export {
    onArtifactEvent,
    getArtifactUrl,
    shouldGenerateArtifact,
    type ArtifactEvent,
} from "./artifact-generator"
