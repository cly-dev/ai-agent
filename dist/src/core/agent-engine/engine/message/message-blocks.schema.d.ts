import { z } from 'zod';
export declare const messageBlockSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"text">;
    content: z.ZodString;
    format: z.ZodOptional<z.ZodEnum<{
        markdown: "markdown";
        plain: "plain";
        html: "html";
    }>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"list">;
    title: z.ZodOptional<z.ZodString>;
    listType: z.ZodOptional<z.ZodEnum<{
        bullet: "bullet";
        ordered: "ordered";
        checklist: "checklist";
    }>>;
    items: z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        checked: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"quote">;
    content: z.ZodString;
    source: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"code">;
    language: z.ZodOptional<z.ZodString>;
    filename: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"chart">;
    chartType: z.ZodEnum<{
        bar: "bar";
        line: "line";
        pie: "pie";
    }>;
    title: z.ZodOptional<z.ZodString>;
    xAxis: z.ZodArray<z.ZodString>;
    series: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        values: z.ZodArray<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"table">;
    title: z.ZodOptional<z.ZodString>;
    columns: z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        label: z.ZodString;
        align: z.ZodOptional<z.ZodEnum<{
            left: "left";
            center: "center";
            right: "right";
        }>>;
    }, z.core.$strip>>;
    data: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"metric">;
    items: z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        value: z.ZodString;
        delta: z.ZodOptional<z.ZodString>;
        trend: z.ZodOptional<z.ZodEnum<{
            up: "up";
            down: "down";
            flat: "flat";
        }>>;
    }, z.core.$strip>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"alert">;
    severity: z.ZodEnum<{
        success: "success";
        info: "info";
        error: "error";
        warning: "warning";
    }>;
    title: z.ZodOptional<z.ZodString>;
    message: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"image">;
    url: z.ZodString;
    alt: z.ZodOptional<z.ZodString>;
    caption: z.ZodOptional<z.ZodString>;
    width: z.ZodOptional<z.ZodString>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"loading">;
    id: z.ZodString;
    hint: z.ZodOptional<z.ZodString>;
}, z.core.$strip>], "type">;
export declare const messageBlocksPayloadSchema: z.ZodObject<{
    blocks: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        type: z.ZodLiteral<"text">;
        content: z.ZodString;
        format: z.ZodOptional<z.ZodEnum<{
            markdown: "markdown";
            plain: "plain";
            html: "html";
        }>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"list">;
        title: z.ZodOptional<z.ZodString>;
        listType: z.ZodOptional<z.ZodEnum<{
            bullet: "bullet";
            ordered: "ordered";
            checklist: "checklist";
        }>>;
        items: z.ZodArray<z.ZodObject<{
            text: z.ZodString;
            checked: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"quote">;
        content: z.ZodString;
        source: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"code">;
        language: z.ZodOptional<z.ZodString>;
        filename: z.ZodOptional<z.ZodString>;
        content: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"chart">;
        chartType: z.ZodEnum<{
            bar: "bar";
            line: "line";
            pie: "pie";
        }>;
        title: z.ZodOptional<z.ZodString>;
        xAxis: z.ZodArray<z.ZodString>;
        series: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            values: z.ZodArray<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"table">;
        title: z.ZodOptional<z.ZodString>;
        columns: z.ZodArray<z.ZodObject<{
            key: z.ZodString;
            label: z.ZodString;
            align: z.ZodOptional<z.ZodEnum<{
                left: "left";
                center: "center";
                right: "right";
            }>>;
        }, z.core.$strip>>;
        data: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"metric">;
        items: z.ZodArray<z.ZodObject<{
            label: z.ZodString;
            value: z.ZodString;
            delta: z.ZodOptional<z.ZodString>;
            trend: z.ZodOptional<z.ZodEnum<{
                up: "up";
                down: "down";
                flat: "flat";
            }>>;
        }, z.core.$strip>>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"alert">;
        severity: z.ZodEnum<{
            success: "success";
            info: "info";
            error: "error";
            warning: "warning";
        }>;
        title: z.ZodOptional<z.ZodString>;
        message: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"image">;
        url: z.ZodString;
        alt: z.ZodOptional<z.ZodString>;
        caption: z.ZodOptional<z.ZodString>;
        width: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>, z.ZodObject<{
        type: z.ZodLiteral<"loading">;
        id: z.ZodString;
        hint: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>], "type">>;
}, z.core.$strip>;
export type MessageBlocksPayloadParsed = z.infer<typeof messageBlocksPayloadSchema>;
