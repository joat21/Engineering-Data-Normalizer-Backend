import { Alert, Button, Spinner } from "@heroui/react";

interface AiParsingAlertProps {
  isLoading: boolean;
  count: number;
  onFillFromAi: () => void;
}

export const AiParsingAlert = ({
  isLoading,
  count,
  onFillFromAi,
}: AiParsingAlertProps) => {
  return (
    <>
      {isLoading ? (
        <LoadingAlert />
      ) : (
        <SuccessAlert count={count} onFillFromAi={onFillFromAi} />
      )}
    </>
  );
};

const LoadingAlert = () => {
  return (
    <Alert className="border-2 border-accent rounded-2xl" status="accent">
      <Alert.Indicator>
        <Spinner size="sm" />
      </Alert.Indicator>

      <Alert.Content>
        <Alert.Title>ИИ анализирует документ</Alert.Title>
        <Alert.Description>Вы можете заполнять форму вручную</Alert.Description>
      </Alert.Content>
    </Alert>
  );
};

const SuccessAlert = ({
  count,
  onFillFromAi,
}: Omit<AiParsingAlertProps, "isLoading">) => {
  return (
    <Alert className="border-2 border-success rounded-2xl" status="success">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>ИИ проанализировал документ</Alert.Title>
        <Alert.Description>
          Найдено значений: {count}. Вы можете заполнить ими форму без потери
          введенных данных
        </Alert.Description>
        <Button
          onPress={onFillFromAi}
          className="mt-auto mb-auto bg-success hover:bg-success-hover sm:hidden"
        >
          Заполнить форму
        </Button>
      </Alert.Content>
      <Button
        onPress={onFillFromAi}
        className="mt-auto mb-auto bg-success hover:bg-success-hover hidden sm:block"
        variant="primary"
      >
        Заполнить форму
      </Button>
    </Alert>
  );
};
