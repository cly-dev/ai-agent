import type * as runtime from "@prisma/client/runtime/client";
import * as $Enums from "./enums";
import type * as Prisma from "./internal/prismaNamespace";
export type IntFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntFilter<$PrismaModel> | number;
};
export type StringFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    mode?: Prisma.QueryMode;
    not?: Prisma.NestedStringFilter<$PrismaModel> | string;
};
export type EnumUserStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.UserStatus | Prisma.EnumUserStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.UserStatus[] | Prisma.ListEnumUserStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.UserStatus[] | Prisma.ListEnumUserStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumUserStatusFilter<$PrismaModel> | $Enums.UserStatus;
};
export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedBoolFilter<$PrismaModel> | boolean;
};
export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeFilter<$PrismaModel> | Date | string;
};
export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntWithAggregatesFilter<$PrismaModel> | number;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _avg?: Prisma.NestedFloatFilter<$PrismaModel>;
    _sum?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedIntFilter<$PrismaModel>;
    _max?: Prisma.NestedIntFilter<$PrismaModel>;
};
export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    mode?: Prisma.QueryMode;
    not?: Prisma.NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedStringFilter<$PrismaModel>;
    _max?: Prisma.NestedStringFilter<$PrismaModel>;
};
export type EnumUserStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserStatus | Prisma.EnumUserStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.UserStatus[] | Prisma.ListEnumUserStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.UserStatus[] | Prisma.ListEnumUserStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumUserStatusWithAggregatesFilter<$PrismaModel> | $Enums.UserStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumUserStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumUserStatusFilter<$PrismaModel>;
};
export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedBoolWithAggregatesFilter<$PrismaModel> | boolean;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedBoolFilter<$PrismaModel>;
    _max?: Prisma.NestedBoolFilter<$PrismaModel>;
};
export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedDateTimeFilter<$PrismaModel>;
    _max?: Prisma.NestedDateTimeFilter<$PrismaModel>;
};
export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    mode?: Prisma.QueryMode;
    not?: Prisma.NestedStringNullableFilter<$PrismaModel> | string | null;
};
export type EnumToolLevelFilter<$PrismaModel = never> = {
    equals?: $Enums.ToolLevel | Prisma.EnumToolLevelFieldRefInput<$PrismaModel>;
    in?: $Enums.ToolLevel[] | Prisma.ListEnumToolLevelFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ToolLevel[] | Prisma.ListEnumToolLevelFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumToolLevelFilter<$PrismaModel> | $Enums.ToolLevel;
};
export type SortOrderInput = {
    sort: Prisma.SortOrder;
    nulls?: Prisma.NullsOrder;
};
export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    mode?: Prisma.QueryMode;
    not?: Prisma.NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedStringNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedStringNullableFilter<$PrismaModel>;
};
export type EnumToolLevelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ToolLevel | Prisma.EnumToolLevelFieldRefInput<$PrismaModel>;
    in?: $Enums.ToolLevel[] | Prisma.ListEnumToolLevelFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ToolLevel[] | Prisma.ListEnumToolLevelFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumToolLevelWithAggregatesFilter<$PrismaModel> | $Enums.ToolLevel;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumToolLevelFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumToolLevelFilter<$PrismaModel>;
};
export type EnumAdminRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.AdminRole | Prisma.EnumAdminRoleFieldRefInput<$PrismaModel>;
    in?: $Enums.AdminRole[] | Prisma.ListEnumAdminRoleFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AdminRole[] | Prisma.ListEnumAdminRoleFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAdminRoleFilter<$PrismaModel> | $Enums.AdminRole;
};
export type EnumAdminRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AdminRole | Prisma.EnumAdminRoleFieldRefInput<$PrismaModel>;
    in?: $Enums.AdminRole[] | Prisma.ListEnumAdminRoleFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AdminRole[] | Prisma.ListEnumAdminRoleFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAdminRoleWithAggregatesFilter<$PrismaModel> | $Enums.AdminRole;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumAdminRoleFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumAdminRoleFilter<$PrismaModel>;
};
export type JsonNullableFilter<$PrismaModel = never> = Prisma.PatchUndefined<Prisma.Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>, Required<JsonNullableFilterBase<$PrismaModel>>> | Prisma.OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>;
export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    path?: string[];
    mode?: Prisma.QueryMode | Prisma.EnumQueryModeFieldRefInput<$PrismaModel>;
    string_contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_starts_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_ends_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    array_starts_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_ends_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_contains?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    lt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    lte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    not?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
};
export type JsonNullableWithAggregatesFilter<$PrismaModel = never> = Prisma.PatchUndefined<Prisma.Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>, Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>> | Prisma.OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>;
export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    path?: string[];
    mode?: Prisma.QueryMode | Prisma.EnumQueryModeFieldRefInput<$PrismaModel>;
    string_contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_starts_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_ends_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    array_starts_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_ends_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_contains?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    lt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    lte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    not?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedJsonNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedJsonNullableFilter<$PrismaModel>;
};
export type EnumLlmModelKindFilter<$PrismaModel = never> = {
    equals?: $Enums.LlmModelKind | Prisma.EnumLlmModelKindFieldRefInput<$PrismaModel>;
    in?: $Enums.LlmModelKind[] | Prisma.ListEnumLlmModelKindFieldRefInput<$PrismaModel>;
    notIn?: $Enums.LlmModelKind[] | Prisma.ListEnumLlmModelKindFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumLlmModelKindFilter<$PrismaModel> | $Enums.LlmModelKind;
};
export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntNullableFilter<$PrismaModel> | number | null;
};
export type FloatNullableFilter<$PrismaModel = never> = {
    equals?: number | Prisma.FloatFieldRefInput<$PrismaModel> | null;
    in?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel> | null;
    lt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedFloatNullableFilter<$PrismaModel> | number | null;
};
export type EnumLlmModelKindWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LlmModelKind | Prisma.EnumLlmModelKindFieldRefInput<$PrismaModel>;
    in?: $Enums.LlmModelKind[] | Prisma.ListEnumLlmModelKindFieldRefInput<$PrismaModel>;
    notIn?: $Enums.LlmModelKind[] | Prisma.ListEnumLlmModelKindFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumLlmModelKindWithAggregatesFilter<$PrismaModel> | $Enums.LlmModelKind;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumLlmModelKindFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumLlmModelKindFilter<$PrismaModel>;
};
export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _avg?: Prisma.NestedFloatNullableFilter<$PrismaModel>;
    _sum?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedIntNullableFilter<$PrismaModel>;
};
export type FloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | Prisma.FloatFieldRefInput<$PrismaModel> | null;
    in?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel> | null;
    lt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _avg?: Prisma.NestedFloatNullableFilter<$PrismaModel>;
    _sum?: Prisma.NestedFloatNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedFloatNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedFloatNullableFilter<$PrismaModel>;
};
export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null;
};
export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedDateTimeNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedDateTimeNullableFilter<$PrismaModel>;
};
export type FloatFilter<$PrismaModel = never> = {
    equals?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedFloatFilter<$PrismaModel> | number;
};
export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedFloatWithAggregatesFilter<$PrismaModel> | number;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _avg?: Prisma.NestedFloatFilter<$PrismaModel>;
    _sum?: Prisma.NestedFloatFilter<$PrismaModel>;
    _min?: Prisma.NestedFloatFilter<$PrismaModel>;
    _max?: Prisma.NestedFloatFilter<$PrismaModel>;
};
export type JsonFilter<$PrismaModel = never> = Prisma.PatchUndefined<Prisma.Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>, Required<JsonFilterBase<$PrismaModel>>> | Prisma.OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>;
export type JsonFilterBase<$PrismaModel = never> = {
    equals?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    path?: string[];
    mode?: Prisma.QueryMode | Prisma.EnumQueryModeFieldRefInput<$PrismaModel>;
    string_contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_starts_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_ends_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    array_starts_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_ends_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_contains?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    lt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    lte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    not?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
};
export type JsonWithAggregatesFilter<$PrismaModel = never> = Prisma.PatchUndefined<Prisma.Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>, Required<JsonWithAggregatesFilterBase<$PrismaModel>>> | Prisma.OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>;
export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    path?: string[];
    mode?: Prisma.QueryMode | Prisma.EnumQueryModeFieldRefInput<$PrismaModel>;
    string_contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_starts_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_ends_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    array_starts_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_ends_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_contains?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    lt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    lte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    not?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedJsonFilter<$PrismaModel>;
    _max?: Prisma.NestedJsonFilter<$PrismaModel>;
};
export type EnumMessageFeedbackRatingFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageFeedbackRating | Prisma.EnumMessageFeedbackRatingFieldRefInput<$PrismaModel>;
    in?: $Enums.MessageFeedbackRating[] | Prisma.ListEnumMessageFeedbackRatingFieldRefInput<$PrismaModel>;
    notIn?: $Enums.MessageFeedbackRating[] | Prisma.ListEnumMessageFeedbackRatingFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumMessageFeedbackRatingFilter<$PrismaModel> | $Enums.MessageFeedbackRating;
};
export type EnumMessageFeedbackRatingWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageFeedbackRating | Prisma.EnumMessageFeedbackRatingFieldRefInput<$PrismaModel>;
    in?: $Enums.MessageFeedbackRating[] | Prisma.ListEnumMessageFeedbackRatingFieldRefInput<$PrismaModel>;
    notIn?: $Enums.MessageFeedbackRating[] | Prisma.ListEnumMessageFeedbackRatingFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumMessageFeedbackRatingWithAggregatesFilter<$PrismaModel> | $Enums.MessageFeedbackRating;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumMessageFeedbackRatingFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumMessageFeedbackRatingFilter<$PrismaModel>;
};
export type EnumHttpMethodFilter<$PrismaModel = never> = {
    equals?: $Enums.HttpMethod | Prisma.EnumHttpMethodFieldRefInput<$PrismaModel>;
    in?: $Enums.HttpMethod[] | Prisma.ListEnumHttpMethodFieldRefInput<$PrismaModel>;
    notIn?: $Enums.HttpMethod[] | Prisma.ListEnumHttpMethodFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumHttpMethodFilter<$PrismaModel> | $Enums.HttpMethod;
};
export type EnumHttpMethodWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.HttpMethod | Prisma.EnumHttpMethodFieldRefInput<$PrismaModel>;
    in?: $Enums.HttpMethod[] | Prisma.ListEnumHttpMethodFieldRefInput<$PrismaModel>;
    notIn?: $Enums.HttpMethod[] | Prisma.ListEnumHttpMethodFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumHttpMethodWithAggregatesFilter<$PrismaModel> | $Enums.HttpMethod;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumHttpMethodFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumHttpMethodFilter<$PrismaModel>;
};
export type EnumIntegrationAuthModeFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationAuthMode | Prisma.EnumIntegrationAuthModeFieldRefInput<$PrismaModel>;
    in?: $Enums.IntegrationAuthMode[] | Prisma.ListEnumIntegrationAuthModeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.IntegrationAuthMode[] | Prisma.ListEnumIntegrationAuthModeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumIntegrationAuthModeFilter<$PrismaModel> | $Enums.IntegrationAuthMode;
};
export type EnumIntegrationAuthModeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationAuthMode | Prisma.EnumIntegrationAuthModeFieldRefInput<$PrismaModel>;
    in?: $Enums.IntegrationAuthMode[] | Prisma.ListEnumIntegrationAuthModeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.IntegrationAuthMode[] | Prisma.ListEnumIntegrationAuthModeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumIntegrationAuthModeWithAggregatesFilter<$PrismaModel> | $Enums.IntegrationAuthMode;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumIntegrationAuthModeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumIntegrationAuthModeFilter<$PrismaModel>;
};
export type EnumAgentRunStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentRunStatus | Prisma.EnumAgentRunStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.AgentRunStatus[] | Prisma.ListEnumAgentRunStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AgentRunStatus[] | Prisma.ListEnumAgentRunStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAgentRunStatusFilter<$PrismaModel> | $Enums.AgentRunStatus;
};
export type EnumAgentRunStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentRunStatus | Prisma.EnumAgentRunStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.AgentRunStatus[] | Prisma.ListEnumAgentRunStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AgentRunStatus[] | Prisma.ListEnumAgentRunStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAgentRunStatusWithAggregatesFilter<$PrismaModel> | $Enums.AgentRunStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumAgentRunStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumAgentRunStatusFilter<$PrismaModel>;
};
export type EnumAgentRunRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentRunRole | Prisma.EnumAgentRunRoleFieldRefInput<$PrismaModel>;
    in?: $Enums.AgentRunRole[] | Prisma.ListEnumAgentRunRoleFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AgentRunRole[] | Prisma.ListEnumAgentRunRoleFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAgentRunRoleFilter<$PrismaModel> | $Enums.AgentRunRole;
};
export type EnumAgentRunRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentRunRole | Prisma.EnumAgentRunRoleFieldRefInput<$PrismaModel>;
    in?: $Enums.AgentRunRole[] | Prisma.ListEnumAgentRunRoleFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AgentRunRole[] | Prisma.ListEnumAgentRunRoleFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAgentRunRoleWithAggregatesFilter<$PrismaModel> | $Enums.AgentRunRole;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumAgentRunRoleFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumAgentRunRoleFilter<$PrismaModel>;
};
export type EnumHostToolSkillTriggerFilter<$PrismaModel = never> = {
    equals?: $Enums.HostToolSkillTrigger | Prisma.EnumHostToolSkillTriggerFieldRefInput<$PrismaModel>;
    in?: $Enums.HostToolSkillTrigger[] | Prisma.ListEnumHostToolSkillTriggerFieldRefInput<$PrismaModel>;
    notIn?: $Enums.HostToolSkillTrigger[] | Prisma.ListEnumHostToolSkillTriggerFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumHostToolSkillTriggerFilter<$PrismaModel> | $Enums.HostToolSkillTrigger;
};
export type EnumHostToolSkillTriggerWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.HostToolSkillTrigger | Prisma.EnumHostToolSkillTriggerFieldRefInput<$PrismaModel>;
    in?: $Enums.HostToolSkillTrigger[] | Prisma.ListEnumHostToolSkillTriggerFieldRefInput<$PrismaModel>;
    notIn?: $Enums.HostToolSkillTrigger[] | Prisma.ListEnumHostToolSkillTriggerFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumHostToolSkillTriggerWithAggregatesFilter<$PrismaModel> | $Enums.HostToolSkillTrigger;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumHostToolSkillTriggerFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumHostToolSkillTriggerFilter<$PrismaModel>;
};
export type EnumPageActionDeliveryFilter<$PrismaModel = never> = {
    equals?: $Enums.PageActionDelivery | Prisma.EnumPageActionDeliveryFieldRefInput<$PrismaModel>;
    in?: $Enums.PageActionDelivery[] | Prisma.ListEnumPageActionDeliveryFieldRefInput<$PrismaModel>;
    notIn?: $Enums.PageActionDelivery[] | Prisma.ListEnumPageActionDeliveryFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumPageActionDeliveryFilter<$PrismaModel> | $Enums.PageActionDelivery;
};
export type EnumPageActionDeliveryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PageActionDelivery | Prisma.EnumPageActionDeliveryFieldRefInput<$PrismaModel>;
    in?: $Enums.PageActionDelivery[] | Prisma.ListEnumPageActionDeliveryFieldRefInput<$PrismaModel>;
    notIn?: $Enums.PageActionDelivery[] | Prisma.ListEnumPageActionDeliveryFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumPageActionDeliveryWithAggregatesFilter<$PrismaModel> | $Enums.PageActionDelivery;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumPageActionDeliveryFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumPageActionDeliveryFilter<$PrismaModel>;
};
export type EnumPageActionRunStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PageActionRunStatus | Prisma.EnumPageActionRunStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.PageActionRunStatus[] | Prisma.ListEnumPageActionRunStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.PageActionRunStatus[] | Prisma.ListEnumPageActionRunStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumPageActionRunStatusFilter<$PrismaModel> | $Enums.PageActionRunStatus;
};
export type EnumPageActionRunStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PageActionRunStatus | Prisma.EnumPageActionRunStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.PageActionRunStatus[] | Prisma.ListEnumPageActionRunStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.PageActionRunStatus[] | Prisma.ListEnumPageActionRunStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumPageActionRunStatusWithAggregatesFilter<$PrismaModel> | $Enums.PageActionRunStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumPageActionRunStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumPageActionRunStatusFilter<$PrismaModel>;
};
export type EnumApprovalSourceFilter<$PrismaModel = never> = {
    equals?: $Enums.ApprovalSource | Prisma.EnumApprovalSourceFieldRefInput<$PrismaModel>;
    in?: $Enums.ApprovalSource[] | Prisma.ListEnumApprovalSourceFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ApprovalSource[] | Prisma.ListEnumApprovalSourceFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumApprovalSourceFilter<$PrismaModel> | $Enums.ApprovalSource;
};
export type EnumApprovalStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ApprovalStatus | Prisma.EnumApprovalStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.ApprovalStatus[] | Prisma.ListEnumApprovalStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ApprovalStatus[] | Prisma.ListEnumApprovalStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumApprovalStatusFilter<$PrismaModel> | $Enums.ApprovalStatus;
};
export type EnumApprovalSourceWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ApprovalSource | Prisma.EnumApprovalSourceFieldRefInput<$PrismaModel>;
    in?: $Enums.ApprovalSource[] | Prisma.ListEnumApprovalSourceFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ApprovalSource[] | Prisma.ListEnumApprovalSourceFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumApprovalSourceWithAggregatesFilter<$PrismaModel> | $Enums.ApprovalSource;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumApprovalSourceFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumApprovalSourceFilter<$PrismaModel>;
};
export type EnumApprovalStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ApprovalStatus | Prisma.EnumApprovalStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.ApprovalStatus[] | Prisma.ListEnumApprovalStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ApprovalStatus[] | Prisma.ListEnumApprovalStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumApprovalStatusWithAggregatesFilter<$PrismaModel> | $Enums.ApprovalStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumApprovalStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumApprovalStatusFilter<$PrismaModel>;
};
export type EnumWorkflowProfileFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkflowProfile | Prisma.EnumWorkflowProfileFieldRefInput<$PrismaModel>;
    in?: $Enums.WorkflowProfile[] | Prisma.ListEnumWorkflowProfileFieldRefInput<$PrismaModel>;
    notIn?: $Enums.WorkflowProfile[] | Prisma.ListEnumWorkflowProfileFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumWorkflowProfileFilter<$PrismaModel> | $Enums.WorkflowProfile;
};
export type EnumWorkflowDeliverableFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkflowDeliverable | Prisma.EnumWorkflowDeliverableFieldRefInput<$PrismaModel>;
    in?: $Enums.WorkflowDeliverable[] | Prisma.ListEnumWorkflowDeliverableFieldRefInput<$PrismaModel>;
    notIn?: $Enums.WorkflowDeliverable[] | Prisma.ListEnumWorkflowDeliverableFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumWorkflowDeliverableFilter<$PrismaModel> | $Enums.WorkflowDeliverable;
};
export type EnumWorkflowProfileWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkflowProfile | Prisma.EnumWorkflowProfileFieldRefInput<$PrismaModel>;
    in?: $Enums.WorkflowProfile[] | Prisma.ListEnumWorkflowProfileFieldRefInput<$PrismaModel>;
    notIn?: $Enums.WorkflowProfile[] | Prisma.ListEnumWorkflowProfileFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumWorkflowProfileWithAggregatesFilter<$PrismaModel> | $Enums.WorkflowProfile;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumWorkflowProfileFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumWorkflowProfileFilter<$PrismaModel>;
};
export type EnumWorkflowDeliverableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkflowDeliverable | Prisma.EnumWorkflowDeliverableFieldRefInput<$PrismaModel>;
    in?: $Enums.WorkflowDeliverable[] | Prisma.ListEnumWorkflowDeliverableFieldRefInput<$PrismaModel>;
    notIn?: $Enums.WorkflowDeliverable[] | Prisma.ListEnumWorkflowDeliverableFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumWorkflowDeliverableWithAggregatesFilter<$PrismaModel> | $Enums.WorkflowDeliverable;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumWorkflowDeliverableFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumWorkflowDeliverableFilter<$PrismaModel>;
};
export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntFilter<$PrismaModel> | number;
};
export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedStringFilter<$PrismaModel> | string;
};
export type NestedEnumUserStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.UserStatus | Prisma.EnumUserStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.UserStatus[] | Prisma.ListEnumUserStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.UserStatus[] | Prisma.ListEnumUserStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumUserStatusFilter<$PrismaModel> | $Enums.UserStatus;
};
export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedBoolFilter<$PrismaModel> | boolean;
};
export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeFilter<$PrismaModel> | Date | string;
};
export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntWithAggregatesFilter<$PrismaModel> | number;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _avg?: Prisma.NestedFloatFilter<$PrismaModel>;
    _sum?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedIntFilter<$PrismaModel>;
    _max?: Prisma.NestedIntFilter<$PrismaModel>;
};
export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedFloatFilter<$PrismaModel> | number;
};
export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel>;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedStringFilter<$PrismaModel>;
    _max?: Prisma.NestedStringFilter<$PrismaModel>;
};
export type NestedEnumUserStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserStatus | Prisma.EnumUserStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.UserStatus[] | Prisma.ListEnumUserStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.UserStatus[] | Prisma.ListEnumUserStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumUserStatusWithAggregatesFilter<$PrismaModel> | $Enums.UserStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumUserStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumUserStatusFilter<$PrismaModel>;
};
export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | Prisma.BooleanFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedBoolWithAggregatesFilter<$PrismaModel> | boolean;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedBoolFilter<$PrismaModel>;
    _max?: Prisma.NestedBoolFilter<$PrismaModel>;
};
export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel>;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedDateTimeFilter<$PrismaModel>;
    _max?: Prisma.NestedDateTimeFilter<$PrismaModel>;
};
export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedStringNullableFilter<$PrismaModel> | string | null;
};
export type NestedEnumToolLevelFilter<$PrismaModel = never> = {
    equals?: $Enums.ToolLevel | Prisma.EnumToolLevelFieldRefInput<$PrismaModel>;
    in?: $Enums.ToolLevel[] | Prisma.ListEnumToolLevelFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ToolLevel[] | Prisma.ListEnumToolLevelFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumToolLevelFilter<$PrismaModel> | $Enums.ToolLevel;
};
export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | Prisma.StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    notIn?: string[] | Prisma.ListStringFieldRefInput<$PrismaModel> | null;
    lt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    lte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gt?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    gte?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    startsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    endsWith?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedStringNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedStringNullableFilter<$PrismaModel>;
};
export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntNullableFilter<$PrismaModel> | number | null;
};
export type NestedEnumToolLevelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ToolLevel | Prisma.EnumToolLevelFieldRefInput<$PrismaModel>;
    in?: $Enums.ToolLevel[] | Prisma.ListEnumToolLevelFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ToolLevel[] | Prisma.ListEnumToolLevelFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumToolLevelWithAggregatesFilter<$PrismaModel> | $Enums.ToolLevel;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumToolLevelFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumToolLevelFilter<$PrismaModel>;
};
export type NestedEnumAdminRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.AdminRole | Prisma.EnumAdminRoleFieldRefInput<$PrismaModel>;
    in?: $Enums.AdminRole[] | Prisma.ListEnumAdminRoleFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AdminRole[] | Prisma.ListEnumAdminRoleFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAdminRoleFilter<$PrismaModel> | $Enums.AdminRole;
};
export type NestedEnumAdminRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AdminRole | Prisma.EnumAdminRoleFieldRefInput<$PrismaModel>;
    in?: $Enums.AdminRole[] | Prisma.ListEnumAdminRoleFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AdminRole[] | Prisma.ListEnumAdminRoleFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAdminRoleWithAggregatesFilter<$PrismaModel> | $Enums.AdminRole;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumAdminRoleFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumAdminRoleFilter<$PrismaModel>;
};
export type NestedJsonNullableFilter<$PrismaModel = never> = Prisma.PatchUndefined<Prisma.Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>, Required<NestedJsonNullableFilterBase<$PrismaModel>>> | Prisma.OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>;
export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    path?: string[];
    mode?: Prisma.QueryMode | Prisma.EnumQueryModeFieldRefInput<$PrismaModel>;
    string_contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_starts_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_ends_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    array_starts_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_ends_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_contains?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    lt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    lte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    not?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
};
export type NestedEnumLlmModelKindFilter<$PrismaModel = never> = {
    equals?: $Enums.LlmModelKind | Prisma.EnumLlmModelKindFieldRefInput<$PrismaModel>;
    in?: $Enums.LlmModelKind[] | Prisma.ListEnumLlmModelKindFieldRefInput<$PrismaModel>;
    notIn?: $Enums.LlmModelKind[] | Prisma.ListEnumLlmModelKindFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumLlmModelKindFilter<$PrismaModel> | $Enums.LlmModelKind;
};
export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | Prisma.FloatFieldRefInput<$PrismaModel> | null;
    in?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel> | null;
    lt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedFloatNullableFilter<$PrismaModel> | number | null;
};
export type NestedEnumLlmModelKindWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LlmModelKind | Prisma.EnumLlmModelKindFieldRefInput<$PrismaModel>;
    in?: $Enums.LlmModelKind[] | Prisma.ListEnumLlmModelKindFieldRefInput<$PrismaModel>;
    notIn?: $Enums.LlmModelKind[] | Prisma.ListEnumLlmModelKindFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumLlmModelKindWithAggregatesFilter<$PrismaModel> | $Enums.LlmModelKind;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumLlmModelKindFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumLlmModelKindFilter<$PrismaModel>;
};
export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | Prisma.IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | Prisma.ListIntFieldRefInput<$PrismaModel> | null;
    lt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.IntFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _avg?: Prisma.NestedFloatNullableFilter<$PrismaModel>;
    _sum?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedIntNullableFilter<$PrismaModel>;
};
export type NestedFloatNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | Prisma.FloatFieldRefInput<$PrismaModel> | null;
    in?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel> | null;
    notIn?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel> | null;
    lt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedFloatNullableWithAggregatesFilter<$PrismaModel> | number | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _avg?: Prisma.NestedFloatNullableFilter<$PrismaModel>;
    _sum?: Prisma.NestedFloatNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedFloatNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedFloatNullableFilter<$PrismaModel>;
};
export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null;
};
export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    notIn?: Date[] | string[] | Prisma.ListDateTimeFieldRefInput<$PrismaModel> | null;
    lt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | Prisma.DateTimeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null;
    _count?: Prisma.NestedIntNullableFilter<$PrismaModel>;
    _min?: Prisma.NestedDateTimeNullableFilter<$PrismaModel>;
    _max?: Prisma.NestedDateTimeNullableFilter<$PrismaModel>;
};
export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    in?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel>;
    notIn?: number[] | Prisma.ListFloatFieldRefInput<$PrismaModel>;
    lt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    lte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gt?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    gte?: number | Prisma.FloatFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedFloatWithAggregatesFilter<$PrismaModel> | number;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _avg?: Prisma.NestedFloatFilter<$PrismaModel>;
    _sum?: Prisma.NestedFloatFilter<$PrismaModel>;
    _min?: Prisma.NestedFloatFilter<$PrismaModel>;
    _max?: Prisma.NestedFloatFilter<$PrismaModel>;
};
export type NestedJsonFilter<$PrismaModel = never> = Prisma.PatchUndefined<Prisma.Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>, Required<NestedJsonFilterBase<$PrismaModel>>> | Prisma.OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>;
export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
    path?: string[];
    mode?: Prisma.QueryMode | Prisma.EnumQueryModeFieldRefInput<$PrismaModel>;
    string_contains?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_starts_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    string_ends_with?: string | Prisma.StringFieldRefInput<$PrismaModel>;
    array_starts_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_ends_with?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    array_contains?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | null;
    lt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    lte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gt?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    gte?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel>;
    not?: runtime.InputJsonValue | Prisma.JsonFieldRefInput<$PrismaModel> | Prisma.JsonNullValueFilter;
};
export type NestedEnumMessageFeedbackRatingFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageFeedbackRating | Prisma.EnumMessageFeedbackRatingFieldRefInput<$PrismaModel>;
    in?: $Enums.MessageFeedbackRating[] | Prisma.ListEnumMessageFeedbackRatingFieldRefInput<$PrismaModel>;
    notIn?: $Enums.MessageFeedbackRating[] | Prisma.ListEnumMessageFeedbackRatingFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumMessageFeedbackRatingFilter<$PrismaModel> | $Enums.MessageFeedbackRating;
};
export type NestedEnumMessageFeedbackRatingWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.MessageFeedbackRating | Prisma.EnumMessageFeedbackRatingFieldRefInput<$PrismaModel>;
    in?: $Enums.MessageFeedbackRating[] | Prisma.ListEnumMessageFeedbackRatingFieldRefInput<$PrismaModel>;
    notIn?: $Enums.MessageFeedbackRating[] | Prisma.ListEnumMessageFeedbackRatingFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumMessageFeedbackRatingWithAggregatesFilter<$PrismaModel> | $Enums.MessageFeedbackRating;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumMessageFeedbackRatingFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumMessageFeedbackRatingFilter<$PrismaModel>;
};
export type NestedEnumHttpMethodFilter<$PrismaModel = never> = {
    equals?: $Enums.HttpMethod | Prisma.EnumHttpMethodFieldRefInput<$PrismaModel>;
    in?: $Enums.HttpMethod[] | Prisma.ListEnumHttpMethodFieldRefInput<$PrismaModel>;
    notIn?: $Enums.HttpMethod[] | Prisma.ListEnumHttpMethodFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumHttpMethodFilter<$PrismaModel> | $Enums.HttpMethod;
};
export type NestedEnumHttpMethodWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.HttpMethod | Prisma.EnumHttpMethodFieldRefInput<$PrismaModel>;
    in?: $Enums.HttpMethod[] | Prisma.ListEnumHttpMethodFieldRefInput<$PrismaModel>;
    notIn?: $Enums.HttpMethod[] | Prisma.ListEnumHttpMethodFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumHttpMethodWithAggregatesFilter<$PrismaModel> | $Enums.HttpMethod;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumHttpMethodFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumHttpMethodFilter<$PrismaModel>;
};
export type NestedEnumIntegrationAuthModeFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationAuthMode | Prisma.EnumIntegrationAuthModeFieldRefInput<$PrismaModel>;
    in?: $Enums.IntegrationAuthMode[] | Prisma.ListEnumIntegrationAuthModeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.IntegrationAuthMode[] | Prisma.ListEnumIntegrationAuthModeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumIntegrationAuthModeFilter<$PrismaModel> | $Enums.IntegrationAuthMode;
};
export type NestedEnumIntegrationAuthModeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.IntegrationAuthMode | Prisma.EnumIntegrationAuthModeFieldRefInput<$PrismaModel>;
    in?: $Enums.IntegrationAuthMode[] | Prisma.ListEnumIntegrationAuthModeFieldRefInput<$PrismaModel>;
    notIn?: $Enums.IntegrationAuthMode[] | Prisma.ListEnumIntegrationAuthModeFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumIntegrationAuthModeWithAggregatesFilter<$PrismaModel> | $Enums.IntegrationAuthMode;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumIntegrationAuthModeFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumIntegrationAuthModeFilter<$PrismaModel>;
};
export type NestedEnumAgentRunStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentRunStatus | Prisma.EnumAgentRunStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.AgentRunStatus[] | Prisma.ListEnumAgentRunStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AgentRunStatus[] | Prisma.ListEnumAgentRunStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAgentRunStatusFilter<$PrismaModel> | $Enums.AgentRunStatus;
};
export type NestedEnumAgentRunStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentRunStatus | Prisma.EnumAgentRunStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.AgentRunStatus[] | Prisma.ListEnumAgentRunStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AgentRunStatus[] | Prisma.ListEnumAgentRunStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAgentRunStatusWithAggregatesFilter<$PrismaModel> | $Enums.AgentRunStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumAgentRunStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumAgentRunStatusFilter<$PrismaModel>;
};
export type NestedEnumAgentRunRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentRunRole | Prisma.EnumAgentRunRoleFieldRefInput<$PrismaModel>;
    in?: $Enums.AgentRunRole[] | Prisma.ListEnumAgentRunRoleFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AgentRunRole[] | Prisma.ListEnumAgentRunRoleFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAgentRunRoleFilter<$PrismaModel> | $Enums.AgentRunRole;
};
export type NestedEnumAgentRunRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AgentRunRole | Prisma.EnumAgentRunRoleFieldRefInput<$PrismaModel>;
    in?: $Enums.AgentRunRole[] | Prisma.ListEnumAgentRunRoleFieldRefInput<$PrismaModel>;
    notIn?: $Enums.AgentRunRole[] | Prisma.ListEnumAgentRunRoleFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumAgentRunRoleWithAggregatesFilter<$PrismaModel> | $Enums.AgentRunRole;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumAgentRunRoleFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumAgentRunRoleFilter<$PrismaModel>;
};
export type NestedEnumHostToolSkillTriggerFilter<$PrismaModel = never> = {
    equals?: $Enums.HostToolSkillTrigger | Prisma.EnumHostToolSkillTriggerFieldRefInput<$PrismaModel>;
    in?: $Enums.HostToolSkillTrigger[] | Prisma.ListEnumHostToolSkillTriggerFieldRefInput<$PrismaModel>;
    notIn?: $Enums.HostToolSkillTrigger[] | Prisma.ListEnumHostToolSkillTriggerFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumHostToolSkillTriggerFilter<$PrismaModel> | $Enums.HostToolSkillTrigger;
};
export type NestedEnumHostToolSkillTriggerWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.HostToolSkillTrigger | Prisma.EnumHostToolSkillTriggerFieldRefInput<$PrismaModel>;
    in?: $Enums.HostToolSkillTrigger[] | Prisma.ListEnumHostToolSkillTriggerFieldRefInput<$PrismaModel>;
    notIn?: $Enums.HostToolSkillTrigger[] | Prisma.ListEnumHostToolSkillTriggerFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumHostToolSkillTriggerWithAggregatesFilter<$PrismaModel> | $Enums.HostToolSkillTrigger;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumHostToolSkillTriggerFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumHostToolSkillTriggerFilter<$PrismaModel>;
};
export type NestedEnumPageActionDeliveryFilter<$PrismaModel = never> = {
    equals?: $Enums.PageActionDelivery | Prisma.EnumPageActionDeliveryFieldRefInput<$PrismaModel>;
    in?: $Enums.PageActionDelivery[] | Prisma.ListEnumPageActionDeliveryFieldRefInput<$PrismaModel>;
    notIn?: $Enums.PageActionDelivery[] | Prisma.ListEnumPageActionDeliveryFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumPageActionDeliveryFilter<$PrismaModel> | $Enums.PageActionDelivery;
};
export type NestedEnumPageActionDeliveryWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PageActionDelivery | Prisma.EnumPageActionDeliveryFieldRefInput<$PrismaModel>;
    in?: $Enums.PageActionDelivery[] | Prisma.ListEnumPageActionDeliveryFieldRefInput<$PrismaModel>;
    notIn?: $Enums.PageActionDelivery[] | Prisma.ListEnumPageActionDeliveryFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumPageActionDeliveryWithAggregatesFilter<$PrismaModel> | $Enums.PageActionDelivery;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumPageActionDeliveryFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumPageActionDeliveryFilter<$PrismaModel>;
};
export type NestedEnumPageActionRunStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.PageActionRunStatus | Prisma.EnumPageActionRunStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.PageActionRunStatus[] | Prisma.ListEnumPageActionRunStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.PageActionRunStatus[] | Prisma.ListEnumPageActionRunStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumPageActionRunStatusFilter<$PrismaModel> | $Enums.PageActionRunStatus;
};
export type NestedEnumPageActionRunStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.PageActionRunStatus | Prisma.EnumPageActionRunStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.PageActionRunStatus[] | Prisma.ListEnumPageActionRunStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.PageActionRunStatus[] | Prisma.ListEnumPageActionRunStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumPageActionRunStatusWithAggregatesFilter<$PrismaModel> | $Enums.PageActionRunStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumPageActionRunStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumPageActionRunStatusFilter<$PrismaModel>;
};
export type NestedEnumApprovalSourceFilter<$PrismaModel = never> = {
    equals?: $Enums.ApprovalSource | Prisma.EnumApprovalSourceFieldRefInput<$PrismaModel>;
    in?: $Enums.ApprovalSource[] | Prisma.ListEnumApprovalSourceFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ApprovalSource[] | Prisma.ListEnumApprovalSourceFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumApprovalSourceFilter<$PrismaModel> | $Enums.ApprovalSource;
};
export type NestedEnumApprovalStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.ApprovalStatus | Prisma.EnumApprovalStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.ApprovalStatus[] | Prisma.ListEnumApprovalStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ApprovalStatus[] | Prisma.ListEnumApprovalStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumApprovalStatusFilter<$PrismaModel> | $Enums.ApprovalStatus;
};
export type NestedEnumApprovalSourceWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ApprovalSource | Prisma.EnumApprovalSourceFieldRefInput<$PrismaModel>;
    in?: $Enums.ApprovalSource[] | Prisma.ListEnumApprovalSourceFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ApprovalSource[] | Prisma.ListEnumApprovalSourceFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumApprovalSourceWithAggregatesFilter<$PrismaModel> | $Enums.ApprovalSource;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumApprovalSourceFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumApprovalSourceFilter<$PrismaModel>;
};
export type NestedEnumApprovalStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.ApprovalStatus | Prisma.EnumApprovalStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.ApprovalStatus[] | Prisma.ListEnumApprovalStatusFieldRefInput<$PrismaModel>;
    notIn?: $Enums.ApprovalStatus[] | Prisma.ListEnumApprovalStatusFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumApprovalStatusWithAggregatesFilter<$PrismaModel> | $Enums.ApprovalStatus;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumApprovalStatusFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumApprovalStatusFilter<$PrismaModel>;
};
export type NestedEnumWorkflowProfileFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkflowProfile | Prisma.EnumWorkflowProfileFieldRefInput<$PrismaModel>;
    in?: $Enums.WorkflowProfile[] | Prisma.ListEnumWorkflowProfileFieldRefInput<$PrismaModel>;
    notIn?: $Enums.WorkflowProfile[] | Prisma.ListEnumWorkflowProfileFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumWorkflowProfileFilter<$PrismaModel> | $Enums.WorkflowProfile;
};
export type NestedEnumWorkflowDeliverableFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkflowDeliverable | Prisma.EnumWorkflowDeliverableFieldRefInput<$PrismaModel>;
    in?: $Enums.WorkflowDeliverable[] | Prisma.ListEnumWorkflowDeliverableFieldRefInput<$PrismaModel>;
    notIn?: $Enums.WorkflowDeliverable[] | Prisma.ListEnumWorkflowDeliverableFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumWorkflowDeliverableFilter<$PrismaModel> | $Enums.WorkflowDeliverable;
};
export type NestedEnumWorkflowProfileWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkflowProfile | Prisma.EnumWorkflowProfileFieldRefInput<$PrismaModel>;
    in?: $Enums.WorkflowProfile[] | Prisma.ListEnumWorkflowProfileFieldRefInput<$PrismaModel>;
    notIn?: $Enums.WorkflowProfile[] | Prisma.ListEnumWorkflowProfileFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumWorkflowProfileWithAggregatesFilter<$PrismaModel> | $Enums.WorkflowProfile;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumWorkflowProfileFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumWorkflowProfileFilter<$PrismaModel>;
};
export type NestedEnumWorkflowDeliverableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.WorkflowDeliverable | Prisma.EnumWorkflowDeliverableFieldRefInput<$PrismaModel>;
    in?: $Enums.WorkflowDeliverable[] | Prisma.ListEnumWorkflowDeliverableFieldRefInput<$PrismaModel>;
    notIn?: $Enums.WorkflowDeliverable[] | Prisma.ListEnumWorkflowDeliverableFieldRefInput<$PrismaModel>;
    not?: Prisma.NestedEnumWorkflowDeliverableWithAggregatesFilter<$PrismaModel> | $Enums.WorkflowDeliverable;
    _count?: Prisma.NestedIntFilter<$PrismaModel>;
    _min?: Prisma.NestedEnumWorkflowDeliverableFilter<$PrismaModel>;
    _max?: Prisma.NestedEnumWorkflowDeliverableFilter<$PrismaModel>;
};
