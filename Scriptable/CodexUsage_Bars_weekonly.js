// Codex Usage - Bars (weekly only)
// Compact Scriptable widget for Codex's single weekly window.

// Replace this with your own HTTPS JSON endpoint.
const ENDPOINT = "https://example.com/codex-usage.json";
const REFRESH_AFTER_MINUTES = 5;

const COLORS = {
  background: new Color("#faf9f5"),
  ink: new Color("#141413"),
  muted: new Color("#77736a"),
  rail: new Color("#e8e6dc"),
  accent: new Color("#788c5d"),
  warning: new Color("#b45309"),
  danger: new Color("#8f2d24"),
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
  widget.backgroundColor = COLORS.background;
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
  widget.addSpacer(11);
  addEyebrow(widget, "WEEKLY REMAINING");
  widget.addSpacer(2);
  addValue(widget, weekly, 42);
  widget.addSpacer(8);
  addProgressBar(widget, weekly, 116, 10);
  widget.addSpacer(7);
  addResetLine(widget, weekly, 10);
  widget.addSpacer();
  addFooter(widget, payload);
}

function buildMedium(widget, payload) {
  const weekly = weeklyData(payload);
  addHeader(widget, payload);
  widget.addSpacer(10);

  const row = widget.addStack();
  row.layoutHorizontally();
  row.bottomAlignContent();
  const copy = row.addStack();
  copy.layoutVertically();
  addEyebrow(copy, "WEEKLY CAPACITY");
  copy.addSpacer(3);
  const label = copy.addText("Remaining");
  label.font = bodyFont(12);
  label.textColor = COLORS.muted;
  row.addSpacer();
  addValue(row, weekly, 48);

  widget.addSpacer(8);
  addProgressBar(widget, weekly, 292, 12);
  widget.addSpacer(7);
  addMediumMetadata(widget, weekly);
  widget.addSpacer();
  addFooter(widget, payload);
}

function buildLarge(widget, payload) {
  const weekly = weeklyData(payload);
  addHeader(widget, payload);
  widget.addSpacer(26);
  addEyebrow(widget, "WEEKLY CAPACITY");
  widget.addSpacer(5);
  addValue(widget, weekly, 72);
  widget.addSpacer(16);
  addProgressBar(widget, weekly, 292, 18);
  widget.addSpacer(16);
  addLargeMetadata(widget, weekly);
  widget.addSpacer();
  addFooter(widget, payload);
}

function addHeader(parent, payload) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();
  const title = row.addText("Codex");
  title.font = headingFont(16, "semibold");
  title.textColor = COLORS.ink;
  row.addSpacer(7);
  const style = row.addText("weekly");
  style.font = bodyFont(10);
  style.textColor = COLORS.muted;
  row.addSpacer();
  const status = row.addText(payload.stale ? "STALE" : "LIVE");
  status.font = headingFont(10, "medium");
  status.textColor = payload.stale ? COLORS.warning : COLORS.ink;
}

function addEyebrow(parent, value) {
  const text = parent.addText(value);
  text.font = headingFont(10, "medium");
  text.textColor = COLORS.muted;
  text.lineLimit = 1;
}

function addValue(parent, weekly, size) {
  const value = parent.addText(percentText(weekly));
  value.font = headingFont(size, "semibold");
  value.textColor = colorFor(weekly);
  value.lineLimit = 1;
  value.minimumScaleFactor = 0.55;
}

function addProgressBar(parent, weekly, width, height) {
  const raw = numericValue(weekly?.remainingPercent);
  const value = clamp(raw);
  const context = new DrawContext();
  context.size = new Size(width, height);
  context.opaque = false;
  context.respectScreenScale = true;
  roundedRect(context, 0, 0, width, height, height / 2, COLORS.rail);
  if (raw !== null && value > 0) {
    roundedRect(context, 0, 0, Math.max(height, width * value / 100), height, height / 2, colorFor(weekly));
  }
  const image = parent.addImage(context.getImage());
  image.imageSize = new Size(width, height);
}

function addMediumMetadata(parent, weekly) {
  const row = parent.addStack();
  row.layoutHorizontally();
  const reset = row.addText(`Resets in ${durationText(weekly?.resetAfterSeconds)}`);
  reset.font = bodyFont(11);
  reset.textColor = COLORS.muted;
  row.addSpacer();
  const used = row.addText(`Used ${usedText(weekly)}`);
  used.font = bodyFont(11);
  used.textColor = COLORS.muted;
}

function addLargeMetadata(parent, weekly) {
  const row = parent.addStack();
  row.layoutHorizontally();
  addSpec(row, "REMAINING", percentText(weekly), 92);
  addSpec(row, "USED", usedText(weekly), 72);
  addSpec(row, "RESETS IN", durationText(weekly?.resetAfterSeconds), 110);
}

function addSpec(parent, label, value, width) {
  const block = parent.addStack();
  block.layoutVertically();
  block.size = new Size(width, 34);
  addEyebrow(block, label);
  block.addSpacer(3);
  const text = block.addText(value);
  text.font = headingFont(15, "semibold");
  text.textColor = COLORS.ink;
  text.minimumScaleFactor = 0.65;
}

function addResetLine(parent, weekly, size) {
  const text = parent.addText(`Resets in ${durationText(weekly?.resetAfterSeconds)}`);
  text.font = bodyFont(size);
  text.textColor = COLORS.muted;
  text.lineLimit = 1;
}

function addFooter(parent, payload) {
  const text = parent.addText(payload.stale ? `sync ${payload.status || "stale"}` : `updated ${updatedText(payload.updatedAtLocal) || "--"}`);
  text.font = bodyFont(9);
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
  if (value <= 15) return COLORS.danger;
  if (value <= 30) return COLORS.warning;
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

function headingFont(size, weight) {
  const names = weight === "medium" ? ["AvenirNext-Medium", "HelveticaNeue-Medium"] : ["AvenirNext-DemiBold", "HelveticaNeue-Bold"];
  return firstFont(names, size, weight === "medium" ? Font.mediumSystemFont(size) : Font.semiboldSystemFont(size));
}

function bodyFont(size) {
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
