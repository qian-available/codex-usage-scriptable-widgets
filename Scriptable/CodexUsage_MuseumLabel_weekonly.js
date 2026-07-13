// Codex Usage - Museum Label (weekly only)
// A compact Scriptable widget for Codex's single weekly window.

// Replace this with your own HTTPS JSON endpoint.
const ENDPOINT = "https://example.com/codex-usage.json";
const REFRESH_AFTER_MINUTES = 5;

const COLORS = {
  paper: new Color("#f2f0e8"),
  ink: new Color("#171715"),
  muted: new Color("#77746b"),
  rule: new Color("#d3d0c5"),
  accent: new Color("#3d6f8f"),
  warning: new Color("#9a3d2f"),
};

const previewPayload = {
  stale: false,
  status: "preview",
  updatedAtLocal: "2026-07-13 20:09:50",
  weekly: { remainingPercent: 64, usedPercent: 36, resetAfterSeconds: 352800 },
};

main().catch((error) => {
  console.error(error);
  Script.complete();
});

async function main() {
  const payload = config.runsInWidget
    ? await loadUsage().catch(() => fallbackPayload("fetch failed"))
    : await loadUsage().catch(() => previewPayload);
  const widget = buildWidget(payload);

  if (config.runsInWidget) Script.setWidget(widget);
  else await present(widget);

  Script.complete();
}

async function loadUsage() {
  const req = new Request(ENDPOINT);
  req.timeoutInterval = 15;
  return await req.loadJSON();
}

async function present(widget) {
  const family = config.widgetFamily || "medium";
  if (family === "small") return await widget.presentSmall();
  if (family === "large") return await widget.presentLarge();
  return await widget.presentMedium();
}

function buildWidget(payload) {
  const family = config.widgetFamily || "medium";
  const widget = new ListWidget();
  widget.backgroundColor = COLORS.paper;
  widget.refreshAfterDate = new Date(Date.now() + REFRESH_AFTER_MINUTES * 60 * 1000);

  if (family === "small") {
    widget.setPadding(14, 14, 12, 14);
    buildSmall(widget, payload);
  } else if (family === "large") {
    widget.setPadding(18, 18, 16, 18);
    buildLarge(widget, payload);
  } else {
    widget.setPadding(14, 16, 12, 16);
    buildMedium(widget, payload);
  }
  return widget;
}

function buildSmall(widget, payload) {
  const weekly = weeklyData(payload);
  addHeader(widget, payload);
  widget.addSpacer(8);
  addLabel(widget, "WEEKLY REMAINING");
  widget.addSpacer(2);
  addValue(widget, weekly, 36);
  widget.addSpacer(8);
  addRail(widget, weekly, 112, 4);
  widget.addSpacer(7);
  addResetLine(widget, weekly, 9);
  widget.addSpacer();
  addFooter(widget, payload);
}

function buildMedium(widget, payload) {
  const weekly = weeklyData(payload);
  addHeader(widget, payload);
  widget.addSpacer(6);
  addRule(widget, 292);
  widget.addSpacer(9);

  const row = widget.addStack();
  row.layoutHorizontally();
  row.bottomAlignContent();
  const copy = row.addStack();
  copy.layoutVertically();
  addLabel(copy, "WEEKLY CAPACITY");
  copy.addSpacer(3);
  const remaining = copy.addText("Remaining");
  remaining.font = labelFont(12);
  remaining.textColor = COLORS.muted;
  row.addSpacer();
  addValue(row, weekly, 44);

  widget.addSpacer(8);
  addRail(widget, weekly, 292, 5);
  widget.addSpacer(7);
  addMediumMetadata(widget, weekly);
  widget.addSpacer();
  addFooter(widget, payload);
}

function buildLarge(widget, payload) {
  const weekly = weeklyData(payload);
  addHeader(widget, payload);
  widget.addSpacer(12);
  addRule(widget, 292);
  widget.addSpacer(22);
  addLabel(widget, "WEEKLY CAPACITY");
  widget.addSpacer(5);
  addValue(widget, weekly, 70);
  widget.addSpacer(16);
  addRail(widget, weekly, 292, 7);
  widget.addSpacer(16);
  addLargeMetadata(widget, weekly);
  widget.addSpacer();
  addFooter(widget, payload);
}

function addHeader(parent, payload) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.bottomAlignContent();
  const title = row.addText("Codex Usage");
  title.font = titleFont(16);
  title.textColor = COLORS.ink;
  row.addSpacer();
  const status = row.addText(payload.stale ? "Stale" : "Live");
  status.font = labelFont(10);
  status.textColor = payload.stale ? COLORS.warning : COLORS.muted;
}

function addLabel(parent, value) {
  const label = parent.addText(value);
  label.font = labelFont(9);
  label.textColor = COLORS.muted;
  label.lineLimit = 1;
}

function addValue(parent, weekly, size) {
  const value = parent.addText(percentText(weekly));
  value.font = titleFont(size);
  value.textColor = colorFor(weekly);
  value.lineLimit = 1;
  value.minimumScaleFactor = 0.56;
}

function addRail(parent, weekly, width, height) {
  const raw = numericValue(weekly?.remainingPercent);
  const value = clamp(raw);
  const context = new DrawContext();
  context.size = new Size(width, height + 8);
  context.opaque = false;
  context.respectScreenScale = true;

  roundedRect(context, 0, 4, width, height, height / 2, COLORS.rule);
  if (raw !== null && value > 0) {
    const fill = Math.max(height, width * value / 100);
    roundedRect(context, 0, 4, fill, height, height / 2, colorFor(weekly));
    circle(context, Math.min(width - 7, Math.max(0, fill - 3.5)), 1, 7, colorFor(weekly));
  }

  const image = parent.addImage(context.getImage());
  image.imageSize = new Size(width, height + 8);
}

function addMediumMetadata(parent, weekly) {
  const row = parent.addStack();
  row.layoutHorizontally();
  const reset = row.addText(`Resets in ${durationText(weekly?.resetAfterSeconds)}`);
  reset.font = labelFont(10);
  reset.textColor = COLORS.muted;
  row.addSpacer();
  const used = row.addText(`Used ${usedText(weekly)}`);
  used.font = labelFont(10);
  used.textColor = COLORS.muted;
}

function addLargeMetadata(parent, weekly) {
  const row = parent.addStack();
  row.layoutHorizontally();
  addSpec(row, "Remaining", percentText(weekly), 94);
  addSpec(row, "Used", usedText(weekly), 72);
  addSpec(row, "Resets in", durationText(weekly?.resetAfterSeconds), 110);
}

function addSpec(parent, label, value, width) {
  const block = parent.addStack();
  block.layoutVertically();
  block.size = new Size(width, 34);
  const name = block.addText(label);
  name.font = labelFont(9);
  name.textColor = COLORS.muted;
  block.addSpacer(3);
  const text = block.addText(value);
  text.font = labelFont(14);
  text.textColor = COLORS.ink;
  text.minimumScaleFactor = 0.65;
}

function addResetLine(parent, weekly, size) {
  const reset = parent.addText(`Resets in ${durationText(weekly?.resetAfterSeconds)}`);
  reset.font = labelFont(size);
  reset.textColor = COLORS.muted;
  reset.lineLimit = 1;
}

function addRule(parent, width) {
  const line = parent.addStack();
  line.backgroundColor = COLORS.rule;
  line.size = new Size(width, 1);
}

function addFooter(parent, payload) {
  const text = parent.addText(payload.stale ? `Sync ${payload.status || "stale"}` : `Updated ${updatedText(payload.updatedAtLocal) || "--"}`);
  text.font = labelFont(9);
  text.textColor = payload.stale ? COLORS.warning : COLORS.muted;
  text.lineLimit = 1;
}

function weeklyData(payload) {
  return payload?.weekly || {};
}

function numericValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function percentText(weekly) {
  const value = numericValue(weekly?.remainingPercent);
  return value === null ? "--" : `${Math.round(value)}%`;
}

function usedText(weekly) {
  const used = numericValue(weekly?.usedPercent);
  if (used !== null) return `${Math.round(used)}%`;
  const remaining = numericValue(weekly?.remainingPercent);
  return remaining === null ? "--" : `${Math.round(100 - remaining)}%`;
}

function colorFor(weekly) {
  const value = numericValue(weekly?.remainingPercent);
  if (value === null) return COLORS.muted;
  if (value <= 15) return COLORS.warning;
  return COLORS.accent;
}

function clamp(value) {
  if (value === null) return 0;
  return Math.max(0, Math.min(100, value));
}

function durationText(seconds) {
  const value = numericValue(seconds);
  if (value === null) return "--";
  const total = Math.max(0, Math.round(value));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.round((total % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function updatedText(value) {
  const match = String(value || "").match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

function fallbackPayload(reason) {
  return { stale: true, status: reason, updatedAtLocal: "", weekly: {} };
}

function roundedRect(context, x, y, width, height, radius, color) {
  const path = new Path();
  path.addRoundedRect(new Rect(x, y, width, height), radius, radius);
  context.addPath(path);
  context.setFillColor(color);
  context.fillPath();
}

function circle(context, x, y, size, color) {
  const path = new Path();
  path.addEllipse(new Rect(x, y, size, size));
  context.addPath(path);
  context.setFillColor(color);
  context.fillPath();
}

function titleFont(size) {
  return firstFont(["Georgia", "TimesNewRomanPSMT", "Palatino-Roman"], size, Font.semiboldSystemFont(size));
}

function labelFont(size) {
  return firstFont(["AvenirNext-Regular", "HelveticaNeue", "ArialMT"], size, Font.systemFont(size));
}

function firstFont(names, size, fallback) {
  for (const name of names) {
    try {
      return new Font(name, size);
    } catch (error) {
    }
  }
  return fallback;
}
