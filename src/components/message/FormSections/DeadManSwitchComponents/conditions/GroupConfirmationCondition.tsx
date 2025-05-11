
import { GroupConfirmation } from "../GroupConfirmation";

export function GroupConfirmationCondition() {
  return (
    <GroupConfirmation
      confirmationsRequired={3}
      setConfirmationsRequired={() => {}}
    />
  );
}
