import { forwardRef, useImperativeHandle, useMemo } from "react";
import { Button, Form } from "@heroui/react";
import {
  useForm,
  FormProvider,
  type FieldValues,
  type SubmitHandler,
} from "react-hook-form";
import {
  MappingTargetType,
  type AiParseFileResult,
  type CategoryAttribute,
} from "@engineering-data-normalizer/shared";
import { AttributeField } from "@/entities/category-attribute";

interface SingleImportFormProps {
  attributes: CategoryAttribute[] | undefined;
  onSubmit: SubmitHandler<FieldValues>;
  isPending: boolean;
  aiParseResult: AiParseFileResult;
}

export const SingleImportForm = forwardRef(
  (
    { attributes, onSubmit, isPending, aiParseResult }: SingleImportFormProps,
    ref,
  ) => {
    const methods = useForm<FieldValues>({ mode: "onChange" });
    const {
      handleSubmit,
      setValue,
      getValues,
      formState: { dirtyFields },
    } = methods;

    const [systemFields, technicalFields] = useMemo(() => {
      const systemFields =
        attributes?.filter(
          (a) =>
            a.type === MappingTargetType.SYSTEM &&
            // костыль для того чтобы не отображать эти поля,
            // так как они указаны в начале при инициализации импорта
            a.key !== "manufacturerName" &&
            a.key !== "supplierName",
        ) || [];
      const technicalFields =
        attributes?.filter((a) => a.type === MappingTargetType.ATTRIBUTE) || [];

      return [systemFields, technicalFields];
    }, [attributes]);

    const fillFromAi = () => {
      for (const [key, value] of Object.entries(aiParseResult)) {
        const currentValue = getValues(key);
        const isFieldDirty = dirtyFields[key];

        if (isFieldDirty || currentValue) continue;

        if (value.valueBoolean !== undefined) {
          setValue(key, value.valueBoolean);
        } else if (value.valueMin !== undefined) {
          setValue(`${key}_valueMin`, value.valueMin);
          setValue(`${key}_valueMax`, value.valueMax);
        } else if (value.valueString) {
          setValue(key, value.valueString);
        }
      }
    };

    useImperativeHandle(ref, () => ({
      fillFromAi,
    }));

    return (
      <FormProvider {...methods}>
        <Form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
          <section>
            <h3 className="text-xl font-semibold mb-4">Основные данные</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {systemFields.map((attr) => (
                <AttributeField
                  key={attr.key}
                  attributeKey={attr.key}
                  label={attr.label}
                  unit={attr.unit}
                  options={attr.options}
                  dataType={attr.dataType}
                  variant="secondary"
                />
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-semibold mb-4">
              Технические характеристики
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {technicalFields.map((attr) => (
                <AttributeField
                  key={attr.key}
                  attributeKey={attr.id}
                  label={attr.label}
                  unit={attr.unit}
                  options={attr.options}
                  dataType={attr.dataType}
                  variant="secondary"
                />
              ))}
            </div>
          </section>
          <Button
            className="self-end min-w-36"
            type="submit"
            isPending={isPending}
          >
            Сохранить
          </Button>
        </Form>
      </FormProvider>
    );
  },
);
