const Alert = ({ className, children, ...props }) => (
  <div
    role="alert"
    className={`relative w-full rounded-lg border p-4 ${className}`}
    {...props}
  />
)

const AlertDescription = ({ className, children, ...props }) => (
  <div
    className={`text-sm ${className}`}
    {...props}
  >
    {children}
  </div>
)

export { Alert, AlertDescription }