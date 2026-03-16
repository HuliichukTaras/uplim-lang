"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, AlertTriangle, Info } from "lucide-react"

interface AdultDetectionInfoProps {
  isAdult: boolean
  adultConfidence: number
  moderationWarning: string | null
}

export function AdultDetectionInfo({ isAdult, adultConfidence, moderationWarning }: AdultDetectionInfoProps) {
  if (!isAdult && !moderationWarning) {
    return null
  }

  return (
    <div className="space-y-3">
      {moderationWarning && (
        <Alert className="border-amber-500 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <div className="font-medium mb-1">Automatic 18+ Detection Active</div>
            <div className="text-sm">{moderationWarning}</div>
            <div className="text-xs mt-2 opacity-75">
              This content will be automatically blurred and require unlock methods.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {isAdult && adultConfidence > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-900">
              18+ content detected
              {adultConfidence > 0 && (
                <span className="font-normal text-amber-700 ml-1">({Math.round(adultConfidence * 100)}%)</span>
              )}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Will be blurred and locked. Unlock via payment, subscription, or quest.
            </p>
          </div>
        </div>
      )}

      {/* Removed the section for non-adult content as per the update */}

      <div className="text-xs text-gray-600 p-3 bg-gray-50 rounded-lg neuro-inset">
        <div className="font-medium mb-1 flex items-center gap-2">
          <Info className="h-3 w-3" />
          Automatic Content Moderation
        </div>
        <ul className="space-y-1 ml-5 list-disc">
          <li>All uploads are scanned using Google Cloud Vision AI</li>
          <li>18+ content is automatically detected and cannot be bypassed</li>
          <li>Sensitive content requires unlock methods (subscription/payment/quest)</li>
          <li>This protects TELLOOS from app store violations and payment processor issues</li>
        </ul>
      </div>
    </div>
  )
}
