
import { GroupConfirmation } from "../GroupConfirmation";
import { useState } from "react";

export function GroupConfirmationCondition() {
  const [confirmationsRequired, setConfirmationsRequired] = useState(3);

  return (
    <GroupConfirmation
      confirmationsRequired={confirmationsRequired}
      setConfirmationsRequired={setConfirmationsRequired}
    />
  );
}
