import Ajv2020, { type ErrorObject } from "ajv/dist/2020";
import addFormats from "ajv-formats";
import eventSchema from "@/lib/schema/event.schema.json";
import infrastructureSchema from "@/lib/schema/infrastructure-status.schema.json";
import statementSchema from "@/lib/schema/statement.schema.json";

type ValidatorFn = ((input: unknown) => boolean) & { errors?: ErrorObject[] | null };

let validateEvent: ValidatorFn | null = null;
let validateInfrastructure: ValidatorFn | null = null;
let validateStatement: ValidatorFn | null = null;

try {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  validateEvent = ajv.compile(eventSchema) as ValidatorFn;
  validateInfrastructure = ajv.compile(infrastructureSchema) as ValidatorFn;
  validateStatement = ajv.compile(statementSchema) as ValidatorFn;
} catch (error) {
  // Some runtimes (e.g. Cloudflare Workers) disallow dynamic code generation used by Ajv.
  // In that case we skip runtime schema validation to keep API availability.
  const isTestEnv =
    typeof process !== "undefined" &&
    typeof process.env !== "undefined" &&
    process.env.NODE_ENV === "test";
  if (!isTestEnv) {
    console.warn("Schema validators unavailable in current runtime:", error);
  }
}

function toError(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) {
    return "Unknown validation error";
  }
  return errors.map((error) => `${error.instancePath || "/"} ${error.message}`).join("; ");
}

export function assertValidEvent(input: unknown): void {
  if (!validateEvent) {
    return;
  }
  if (!validateEvent(input)) {
    throw new Error(`Invalid Event: ${toError(validateEvent.errors)}`);
  }
}

export function assertValidInfrastructure(input: unknown): void {
  if (!validateInfrastructure) {
    return;
  }
  if (!validateInfrastructure(input)) {
    throw new Error(`Invalid InfrastructureStatus: ${toError(validateInfrastructure.errors)}`);
  }
}

export function assertValidStatement(input: unknown): void {
  if (!validateStatement) {
    return;
  }
  if (!validateStatement(input)) {
    throw new Error(`Invalid Statement: ${toError(validateStatement.errors)}`);
  }
}
