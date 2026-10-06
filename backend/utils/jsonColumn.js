const { DataTypes } = require('sequelize');

// A TEXT column that stores JSON and transparently parses / stringifies it.
module.exports = function jsonColumn(field, fallback = []) {
  return {
    type: DataTypes.TEXT('medium'),
    get() {
      const raw = this.getDataValue(field);
      if (raw === null || raw === undefined || raw === '') return fallback;
      try { return JSON.parse(raw); } catch { return fallback; }
    },
    set(value) {
      if (typeof value === 'string') {
        try { JSON.parse(value); this.setDataValue(field, value); return; } catch { /* fall through */ }
        this.setDataValue(field, JSON.stringify(fallback));
        return;
      }
      this.setDataValue(field, JSON.stringify(value ?? fallback));
    },
  };
};
