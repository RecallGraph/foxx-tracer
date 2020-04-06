import Endpoint = Foxx.Endpoint;
import { AlternativesSchema, ArraySchema, BooleanSchema, ObjectSchema, StringSchema } from "joi";
import { REFERENCE_CHILD_OF, REFERENCE_FOLLOWS_FROM } from "opentracing";

const joi = require('joi');

export const spanIdSchema: StringSchema = joi
    .string()
    .length(16);

export const traceIdSchema: AlternativesSchema = joi
    .alternatives()
    .try(spanIdSchema, joi
        .string()
        .length(32)
    );

export const contextSchema: ObjectSchema = joi
    .object()
    .keys({
        trace_id: traceIdSchema.required(),
        span_id: spanIdSchema.required(),
        baggage: joi
            .object()
            .required()
    })
    .unknown(true)
    .optionalKeys('baggage', 'trace_id');

export const tagsSchema: ObjectSchema = joi
    .object()
    .pattern(/.+/, joi
        .alternatives()
        .try(joi.string(), joi.boolean(), joi.number())
        .required()
    );

export const logSchema: ObjectSchema = joi
    .object()
    .keys({
        fields: joi
            .object()
            .pattern(/.+/, joi.any())
            .required(),
        timestamp: joi
            .number()
            .required()
    })
    .optionalKeys('timestamp');

export const referenceSchema: ObjectSchema = joi
    .object()
    .keys({
        type: joi
            .string()
            .valid(REFERENCE_CHILD_OF, REFERENCE_FOLLOWS_FROM)
            .required(),
        context: contextSchema.required()
    });
export const spanSchema: ObjectSchema = joi
    .object()
    .keys({
        operation: joi
            .string()
            .required(),
        context: contextSchema.required(),
        startTimeMs: joi
            .number()
            .required(),
        finishTimeMs: joi
            .number()
            .required()
            .min(joi.ref('startTimeMs')),
        tags: tagsSchema.required(),
        logs: joi
            .array()
            .items(logSchema.required())
            .required(),
        references: joi
            .array()
            .items(referenceSchema.required())
            .required()
    })
    .optionalKeys('tags', 'logs', 'references');

export const spanArrSchema: ArraySchema = joi
    .array()
    .items(spanSchema.required())
    .min(1);

export const spanReqSchema: AlternativesSchema = joi
    .alternatives()
    .try(spanSchema, spanArrSchema)
    .required();

export const forceSampleSchema: BooleanSchema = joi.boolean();

export default class Util {
    static setTracerHeaders(endpoint: Endpoint): void {
        endpoint.header('X-Trace-ID', traceIdSchema, '64 or 128 bit trace id to use for creating spans.');
        endpoint.header('X-ParentSpan-ID', spanIdSchema, '64 bit parent span id to use for creating spans.');
        endpoint.header('X-Force-Sample', forceSampleSchema, 'Boolean flag to force sampling on or off. ' +
            'Leave blank to let the tracer decide.');
    }
}