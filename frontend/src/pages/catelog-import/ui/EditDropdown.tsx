import { Button, Dropdown, Label } from "@heroui/react";
import { WandSparkles } from "lucide-react";

export const EditDropdown = () => {
  return (
    <Dropdown>
      <Button isIconOnly>
        <WandSparkles />
      </Button>
      <Dropdown.Popover>
        <Dropdown.Menu onAction={(key) => console.log(`Selected: ${key}`)}>
          <Dropdown.Item id="map-to-attr" textValue="Сопоставить с атрибутом">
            <Label>Сопоставить с атрибутом</Label>
          </Dropdown.Item>
          <Dropdown.Item id="extract-numbers" textValue="Извлечь числа">
            <Label>Извлечь числа</Label>
          </Dropdown.Item>
          <Dropdown.Item id="split" textValue="Разбить по символу">
            <Label>Разбить по символу</Label>
          </Dropdown.Item>
          <Dropdown.Item id="ai-parse" textValue="ИИ-анализ">
            <Label>ИИ-анализ</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
};
