import { memo } from "react";
import {
  Button,
  Dropdown,
  Header,
  Label,
  Separator,
  type Key,
} from "@heroui/react";
import { WandSparkles } from "lucide-react";
import {
  DataType,
  type CategoryAttribute,
} from "@engineering-data-normalizer/shared";
import { TransformationType } from "../model/types";

interface TransformationDropdownProps {
  onAction?: (key: Key) => void;
  selectedAttr: CategoryAttribute | undefined;
}

export const TransformationDropdown = memo(
  ({ onAction, selectedAttr }: TransformationDropdownProps) => {
    return (
      <Dropdown>
        <Button isIconOnly>
          <WandSparkles />
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={onAction}>
            <Dropdown.Section>
              <Header>Преобразования</Header>
              <Dropdown.Item
                id={TransformationType.EXTRACT_NUMBERS}
                textValue="Извлечь числа"
              >
                <Label>Извлечь числа</Label>
              </Dropdown.Item>
              <Dropdown.Item
                id={TransformationType.SPLIT_BY}
                textValue="Разбить по символу"
              >
                <Label>Разбить по символу</Label>
              </Dropdown.Item>
              {(!selectedAttr || selectedAttr.dataType === DataType.NUMBER) && (
                <Dropdown.Item
                  id={TransformationType.MULTIPLY}
                  textValue="Умножить / Разделить"
                >
                  <Label>Умножить / Разделить</Label>
                </Dropdown.Item>
              )}
              <Dropdown.Item
                id={TransformationType.AI_PARSE}
                textValue="ИИ-анализ"
              >
                <Label>ИИ-анализ</Label>
              </Dropdown.Item>
            </Dropdown.Section>
            {selectedAttr && (
              <>
                <Separator />
                <Dropdown.Section>
                  <Header>Действия</Header>
                  <Dropdown.Item
                    id="reset-col"
                    textValue="Сбросить значения"
                    variant="danger"
                  >
                    <Label>Сбросить значения</Label>
                  </Dropdown.Item>
                </Dropdown.Section>
              </>
            )}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    );
  },
);
