import { Label, Switch } from "@heroui/react";

interface ShowOnlyDiffSwitchProps {
  showOnlyDiff: boolean;
  setShowOnlyDiff: (value: boolean) => void;
}

export const ShowOnlyDiffSwitch = ({
  showOnlyDiff,
  setShowOnlyDiff,
}: ShowOnlyDiffSwitchProps) => {
  return (
    <Switch
      className="p-2 rounded-xl w-fit bg-white"
      isSelected={showOnlyDiff}
      onChange={setShowOnlyDiff}
    >
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      <Switch.Content>
        <Label>Только различающиеся характеристики</Label>
      </Switch.Content>
    </Switch>
  );
};
