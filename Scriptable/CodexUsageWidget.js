// Codex Usage widget for Scriptable.
// Paste this file into Scriptable on iPhone, then add a Scriptable widget.

// Replace this with your own HTTPS JSON endpoint.
const ENDPOINT = "https://example.com/codex-usage.json";
const REFRESH_AFTER_MINUTES = 5;

const COLORS = {
  background: new Color("#faf9f5"),
  text: new Color("#141413"),
  muted: new Color("#77736a"),
  divider: new Color("#e8e6dc"),
  accent: new Color("#d97757"),
  blue: new Color("#6a9bcc"),
  green: new Color("#788c5d"),
  warning: new Color("#b45309"),
  danger: new Color("#b91c1c"),
};

const previewData = {
  stale: false,
  status: "ok",
  updatedAtLocal: "2026-07-05 20:09:50",
  fiveHour: { remainingPercent: 86, usedPercent: 14, resetAfterSeconds: 4061 },
  weekly: { remainingPercent: 32, usedPercent: 68, resetAfterSeconds: 178337 },
  display: { short: "5h 86% W 32%", line1: "5h 86%", line2: "W 32%" },
};

main().catch((error) => {
  console.error(error);
  Script.complete();
});

async function main() {
  const data = config.runsInWidget ? await loadUsage() : await loadUsage().catch(() => previewData);
  const widget = buildWidget(data);

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    await widget.presentMedium();
  }

  Script.complete();
}

async function loadUsage() {
  const req = new Request(ENDPOINT);
  req.timeoutInterval = 15;
  return await req.loadJSON();
}

function buildWidget(payload) {
  const family = config.widgetFamily || "medium";
  const widget = new ListWidget();
  widget.backgroundColor = COLORS.background;
  widget.setPadding(16, 16, 14, 16);
  widget.refreshAfterDate = new Date(Date.now() + REFRESH_AFTER_MINUTES * 60 * 1000);

  if (family === "small") {
    buildSmall(widget, payload);
  } else if (family === "large") {
    buildLarge(widget, payload);
  } else {
    buildMedium(widget, payload);
  }

  return widget;
}

function buildSmall(widget, payload) {
  addTitleRow(widget, payload);
  widget.addSpacer(10);
  addBigValue(widget, "5h", percentText(payload.fiveHour), COLORS.blue);
  widget.addSpacer(2);
  addBigValue(widget, "W", percentText(payload.weekly), COLORS.green);
  widget.addSpacer();
  addFooter(widget, payload);
}

function buildMedium(widget, payload) {
  addTitleRow(widget, payload);
  widget.addSpacer(13);

  const row = widget.addStack();
  row.layoutHorizontally();
  addGaugeBlock(row, "5h", "5 hour", payload.fiveHour, COLORS.blue);
  row.addSpacer(14);
  addDivider(row);
  row.addSpacer(14);
  addGaugeBlock(row, "W", "Weekly", payload.weekly, COLORS.green);

  widget.addSpacer();
  addFooter(widget, payload);
}

function buildLarge(widget, payload) {
  addTitleRow(widget, payload);
  widget.addSpacer(18);
  addGaugeBlock(widget, "5h", "5 hour window", payload.fiveHour, COLORS.blue);
  widget.addSpacer(18);
  addGaugeBlock(widget, "W", "Weekly window", payload.weekly, COLORS.green);
  widget.addSpacer();
  addFooter(widget, payload);
}

function addTitleRow(parent, payload) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  const title = row.addText("Codex");
  title.font = Font.semiboldSystemFont(15);
  title.textColor = COLORS.text;

  row.addSpacer();

  const badge = row.addText(payload.stale ? "STALE" : "LIVE");
  badge.font = Font.mediumSystemFont(10);
  badge.textColor = payload.stale ? COLORS.warning : COLORS.accent;
}

function addBigValue(parent, label, value, color) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.bottomAlignContent();

  const labelText = row.addText(label);
  labelText.font = Font.italicSystemFont(26);
  labelText.textColor = COLORS.text;

  row.addSpacer(7);

  const valueText = row.addText(value);
  valueText.font = Font.semiboldSystemFont(28);
  valueText.textColor = color;
  valueText.minimumScaleFactor = 0.6;
}

function addGaugeBlock(parent, label, subtitle, windowData, color) {
  const stack = parent.addStack();
  stack.layoutVertically();

  const labelText = stack.addText(label);
  labelText.font = Font.semiboldSystemFont(16);
  labelText.textColor = COLORS.text;

  stack.addSpacer(2);

  const valueText = stack.addText(percentText(windowData));
  valueText.font = Font.semiboldSystemFont(36);
  valueText.textColor = colorForRemaining(windowData?.remainingPercent, color);
  valueText.lineLimit = 1;
  valueText.minimumScaleFactor = 0.5;

  stack.addSpacer(4);

  const sub = stack.addText(subtitle);
  sub.font = Font.mediumSystemFont(11);
  sub.textColor = COLORS.muted;

  stack.addSpacer(8);
  addProgressBar(stack, windowData?.remainingPercent, color);

  stack.addSpacer(6);
  const reset = stack.addText(resetText(windowData));
  reset.font = Font.systemFont(10);
  reset.textColor = COLORS.muted;
  reset.lineLimit = 1;
  reset.minimumScaleFactor = 0.75;
}

function addProgressBar(parent, remaining, color) {
  const value = Math.max(0, Math.min(100, Number(remaining ?? 0)));
  const width = config.widgetFamily === "large" ? 285 : 118;
  const height = 7;
  const context = new DrawContext();
  context.size = new Size(width, height);
  context.opaque = false;
  context.respectScreenScale = true;

  const bg = new Path();
  bg.addRoundedRect(new Rect(0, 0, width, height), height / 2, height / 2);
  context.addPath(bg);
  context.setFillColor(COLORS.divider);
  context.fillPath();

  const fg = new Path();
  fg.addRoundedRect(new Rect(0, 0, Math.max(height, width * value / 100), height), height / 2, height / 2);
  context.addPath(fg);
  context.setFillColor(colorForRemaining(value, color));
  context.fillPath();

  parent.addImage(context.getImage());
}

function addDivider(parent) {
  const divider = parent.addStack();
  divider.backgroundColor = COLORS.divider;
  divider.size = new Size(1, 64);
}

function addFooter(parent, payload) {
  const footer = parent.addStack();
  footer.layoutHorizontally();
  footer.centerAlignContent();

  const text = payload.stale ? `sync ${payload.status || "stale"}` : updatedText(payload.updatedAtLocal);
  const updated = footer.addText(text);
  updated.font = Font.systemFont(10);
  updated.textColor = payload.stale ? COLORS.warning : COLORS.muted;
  updated.lineLimit = 1;
  updated.minimumScaleFactor = 0.75;
}

function percentText(windowData) {
  const value = windowData?.remainingPercent;
  return Number.isFinite(value) ? `${value}%` : "--";
}

function colorForRemaining(value, fallback) {
  if (!Number.isFinite(value)) return COLORS.muted;
  if (value <= 15) return COLORS.danger;
  if (value <= 30) return COLORS.warning;
  return fallback;
}

function resetText(windowData) {
  const seconds = Number(windowData?.resetAfterSeconds);
  if (!Number.isFinite(seconds)) return "reset --";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.max(0, Math.round((seconds % 3600) / 60));
  if (hours <= 0) return `reset ${minutes}m`;
  return `reset ${hours}h ${minutes}m`;
}

function updatedText(value) {
  if (!value) return "updated --";
  const match = String(value).match(/(\d{2}):(\d{2})/);
  return match ? `updated ${match[1]}:${match[2]}` : "updated";
}
