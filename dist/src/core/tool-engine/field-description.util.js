"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.humanizeFieldName = exports.inferFieldLabel = exports.inferFieldDescription = void 0;
const FIELD_DESCRIPTION_ZH = {
    id: '记录唯一标识',
    code: '业务或响应状态码',
    message: '响应提示信息',
    msg: '响应提示信息',
    success: '请求是否成功',
    name: '名称',
    title: '标题',
    status: '业务状态',
    state: '业务状态',
    type: '类型',
    brand: '品牌',
    shopid: '店铺或站点标识',
    category: '类目',
    backcategory: '后台类目',
    total: '符合条件的总记录数',
    page: '当前页码，从 1 开始',
    pagesize: '每页条数',
    pages: '总页数',
    list: '数据列表',
    records: '数据列表',
    items: '数据列表',
    gmtcreate: '创建时间',
    gmtmodify: '最近修改时间',
    createdat: '创建时间',
    updatedat: '更新时间',
    seolist: 'SEO 标题与关键词配置列表',
    mediaattributes: '图片/视频等媒体资源',
    logisticslist: '物流或配送配置',
    inventory: '库存数量',
    price: '价格',
    sku: 'SKU 编码',
    orderid: '订单 ID',
    productid: '商品 ID',
    userid: '用户 ID',
};
function normalizeFieldKey(fieldName) {
    var _a;
    return ((_a = fieldName.split('.').pop()) !== null && _a !== void 0 ? _a : fieldName)
        .replace(/[_-]+/g, '')
        .toLowerCase();
}
function humanizeFieldName(fieldName) {
    var _a;
    const last = (_a = fieldName.split('.').pop()) !== null && _a !== void 0 ? _a : fieldName;
    return last
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .trim();
}
exports.humanizeFieldName = humanizeFieldName;
function inferFromSampleValue(value) {
    if (typeof value === 'boolean') {
        return '布尔值';
    }
    if (typeof value === 'number') {
        return Number.isInteger(value) ? '整数值' : '数值';
    }
    if (typeof value === 'string') {
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
            return '时间字符串';
        }
        if (value.length <= 32) {
            return `示例值: ${value}`;
        }
        return '文本内容';
    }
    if (Array.isArray(value)) {
        return `数组，示例长度 ${value.length}`;
    }
    return undefined;
}
function inferFieldDescription(fieldName, sampleValue, context) {
    var _a, _b;
    const key = normalizeFieldKey(fieldName);
    const known = FIELD_DESCRIPTION_ZH[key];
    if (known) {
        return known;
    }
    const humanized = humanizeFieldName(fieldName);
    const sampleHint = inferFromSampleValue(sampleValue);
    const toolHint = (_a = context === null || context === void 0 ? void 0 : context.toolDescription) === null || _a === void 0 ? void 0 : _a.trim();
    if (toolHint && humanized.length > 0) {
        return sampleHint
            ? `${humanized}（${sampleHint}）`
            : `${humanized}（来自${(_b = context === null || context === void 0 ? void 0 : context.toolName) !== null && _b !== void 0 ? _b : '工具'}：${toolHint.slice(0, 40)}）`;
    }
    return sampleHint ? `${humanized}（${sampleHint}）` : humanized;
}
exports.inferFieldDescription = inferFieldDescription;
function inferFieldLabel(fieldName) {
    const key = normalizeFieldKey(fieldName);
    const known = FIELD_DESCRIPTION_ZH[key];
    if (known) {
        return known.replace(/（.*?）/g, '').split('，')[0].slice(0, 12);
    }
    return humanizeFieldName(fieldName);
}
exports.inferFieldLabel = inferFieldLabel;
//# sourceMappingURL=field-description.util.js.map