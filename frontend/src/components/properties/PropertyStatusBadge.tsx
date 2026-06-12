import { cn } from "@/lib/utils"
import {
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_CLASSES,
} from "../../lib/propertyUtils"
import type { PropertyStatus } from "../../types/property"

interface Props {
  status: PropertyStatus
  className?: string
}

export default function PropertyStatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        PROPERTY_STATUS_CLASSES[status],
        className
      )}
    >
      {PROPERTY_STATUS_LABELS[status]}
    </span>
  )
}
