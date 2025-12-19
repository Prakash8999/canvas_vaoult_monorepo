"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var pagination_utils_exports = {};
__export(pagination_utils_exports, {
  paginateAndSort: () => paginateAndSort
});
module.exports = __toCommonJS(pagination_utils_exports);
const paginateAndSort = async (model, filters = {}, page = 1, limit = 50, order = [["name", "ASC"]], include = [], attributes, excludeAttributes) => {
  delete filters?.order;
  const offset = (page - 1) * limit;
  let finalAttributes = attributes;
  if (excludeAttributes && excludeAttributes.length > 0) {
    const allAttributes = Object.keys(model.rawAttributes || {});
    finalAttributes = allAttributes.filter((attr) => !excludeAttributes.includes(attr));
  }
  const params = {
    where: filters,
    limit,
    offset,
    include,
    distinct: true,
    attributes: finalAttributes
  };
  if (Array.isArray(order) && order.length > 0) {
    params.order = order;
  }
  const { count, rows } = await model.findAndCountAll(params);
  const totalPages = Math.ceil(count / limit);
  return {
    data: rows.map((record) => record.toJSON()),
    meta: {
      total_count: count,
      total_pages: totalPages,
      limit,
      offset,
      page
    }
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  paginateAndSort
});
//# sourceMappingURL=pagination.utils.js.map
