
export function PanicTrigger() {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-800">
      <h4 className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
        Manual Panic Trigger
      </h4>
      <p className="text-yellow-700 dark:text-yellow-300 text-sm">
        This will create a message that you can manually trigger in an emergency situation.
        A panic button will be available for you to send this message instantly when needed.
      </p>
    </div>
  );
}
