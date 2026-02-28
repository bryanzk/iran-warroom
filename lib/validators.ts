import Ajv2020, { type ErrorObject } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import eventSchema from "@/lib/schema/event.schema.json";
import infrastructureSchema from "@/lib/schema/infrastructure-status.schema.json";
import statementSchema from "@/lib/schema/statement.schema.json";

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const validateEvent = ajv.compile(eventSchema);
const validateInfrastructure = ajv.compile(infrastructureSchema);
const validateStatement = ajv.compile(statementSchema);

function toError(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) {
    return "Unknown validation error";
  }
  return errors.map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ");
}

export function assertValidEvent(input: unknown): void {
  if (!validateEvent(input)) {
    throw new Error(`Invalid Event: ${toError(validateEvent.errors)}`);
  }
}

export function assertValidInfrastructure(input: unknown): void {
  if (!validateInfrastructure(input)) {
    throw new Error(`Invalid InfrastructureStatus: ${toError(validateInfrastructure.errors)}`);
  }
}

export function assertValidStatement(input: unknown): void {
  if (!validateStatement(input)) {
    throw new Error(`Invalid Statement: ${toError(validateStatement.errors)}`);
  }
}
