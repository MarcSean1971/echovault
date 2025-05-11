
import { PanicTrigger } from "../PanicTrigger";
import { PanicTriggerConfig } from "@/types/message";

interface PanicTriggerConditionProps {
  config: PanicTriggerConfig;
  setConfig: (config: PanicTriggerConfig) => void;
}

export function PanicTriggerCondition({
  config,
  setConfig
}: PanicTriggerConditionProps) {
  return (
    <PanicTrigger
      config={config}
      setConfig={setConfig}
    />
  );
}
