import CTAButton from "./CTAButton";

export default function EmptyState({
  title = "No homes match yet",
  message = "Try clearing a filter or searching a different model name.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="empty">
      <span className="placeholder__sun" aria-hidden="true" />
      <h3>{title}</h3>
      <p className="muted">{message}</p>
      {actionLabel && onAction && (
        <CTAButton variant="ghost" onClick={onAction}>
          {actionLabel}
        </CTAButton>
      )}
    </div>
  );
}
