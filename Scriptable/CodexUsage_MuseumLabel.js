// Codex Usage - Museum Label
// Scriptable widget with gallery-label spacing, restrained type, and fine rules.

// Replace this with your own HTTPS JSON endpoint.
const ENDPOINT = "https://example.com/codex-usage.json";
const REFRESH_AFTER_MINUTES = 5;

const COLORS = {
  paper: new Color("#f2f0e8"),
  ink: new Color("#171715"),
  muted: new Color("#77746b"),
  rule: new Color("#d3d0c5"),
  accent: new Color("#3d6f8f"),
  alert: new Color("#9a3d2f"),
};

main().catch((error) => {
  console.error(error);
  Script.complete();
});

async function main() {
  const payload = await loadUsage().catch(() => fallbackPayload("fetch failed"));
  const widget = buildWidget(payload);

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    await present(widget);
  }

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
    widget.setPadding(16, 16, 14, 16);
    buildMedium(widget, payload);
  }

  return widget;
}

function buildSmall(widget, payload) {
  addTitle(widget, payload, false);
  widget.addSpacer(9);
  addFineRule(widget, 112);
  widget.addSpacer(13);
  addSmallLabel(widget, "Five hour", "5h", payload.fiveHour);
  widget.addSpacer(12);
  addSmallLabel(widget, "Weekly", "W", payload.weekly);
  widget.addSpacer();
  addFooter(widget, payload);
}

function buildMedium(widget, payload) {
  addTitle(widget, payload, false);
  widget.addSpacer(9);
  addFineRule(widget, 292);
  widget.addSpacer(12);

  const row = widget.addStack();
  row.layoutHorizontally();
  addLabelBlock(row, "Five hour window", "5h", payload.fiveHour, 137);
  row.addSpacer(16);
  addLabelBlock(row, "Weekly window", "W", payload.weekly, 137);

  widget.addSpacer();
  addFooter(widget, payload);
}

function buildLarge(widget, payload) {
  addTitle(widget, payload, true);
  widget.addSpacer(13);
  addFineRule(widget, 292);
  widget.addSpacer(16);
  addCatalogueBlock(widget, "Five hour window", "5h", payload.fiveHour);
  widget.addSpacer(18);
  addCatalogueBlock(widget, "Weekly window", "W", payload.weekly);
  widget.addSpacer();
  addLargeFooter(widget, payload);
}

function addTitle(parent, payload, large) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.bottomAlignContent();

  const copy = row.addStack();
  copy.layoutVertically();

  const title = copy.addText("Codex Usage");
  title.font = titleFont(large ? 20 : 16);
  title.textColor = COLORS.ink;
  title.lineLimit = 1;

  if (large) {
    copy.addSpacer(3);
    const sub = copy.addText("Remaining capacity by active window");
    sub.font = labelFont(10);
    sub.textColor = COLORS.muted;
    sub.lineLimit = 1;
  }

  row.addSpacer();

  const status = row.addText(payload.stale ? "Stale" : "Live");
  status.font = labelFont(10);
  status.textColor = payload.stale ? COLORS.alert : COLORS.muted;
}

function addSmallLabel(parent, title, label, windowData) {
  const row = parent.addStack();
  row.layoutHorizontally();
  row.bottomAlignContent();

  const copy = row.addStack();
  copy.layoutVertically();

  const t = copy.addText(title);
  t.font = labelFont(10);
  t.textColor = COLORS.muted;
  t.lineLimit = 1;

  copy.addSpacer(2);

  const l = copy.addText(label);
  l.font = labelFont(12);
  l.textColor = COLORS.ink;

  row.addSpacer();

  const value = row.addText(percentText(windowData));
  value.font = titleFont(30);
  value.textColor = COLORS.ink;
  value.lineLimit = 1;
  value.minimumScaleFactor = 0.56;
}

function addLabelBlock(parent, title, label, windowData, width) {
  const block = parent.addStack();
  block.layoutVertically();
  block.size = new Size(width, 96);

  const t = block.addText(title);
  t.font = labelFont(10);
  t.textColor = COLORS.muted;
  t.lineLimit = 1;

  block.addSpacer(4);

  const row = block.addStack();
  row.layoutHorizontally();
  row.bottomAlignContent();

  const l = row.addText(label);
  l.font = labelFont(14);
  l.textColor = COLORS.ink;

  row.addSpacer();

  const value = row.addText(percentText(windowData));
  value.font = titleFont(36);
  value.textColor = COLORS.ink;
  value.lineLimit = 1;
  value.minimumScaleFactor = 0.5;

  block.addSpacer(8);
  addMuseumRail(block, windowData, width, 4);
  block.addSpacer(7);

  const reset = block.addText(`Resets in ${durationText(windowData?.resetAfterSeconds)}`);
  reset.font = labelFont(9);
  reset.textColor = COLORS.muted;
  reset.lineLimit = 1;
}

function addCatalogueBlock(parent, title, label, windowData) {
  const block = parent.addStack();
  block.layoutVertically();

  const intro = block.addStack();
  intro.layoutHorizontally();
  intro.bottomAlignContent();

  const copy = intro.addStack();
  copy.layoutVertically();

  const t = copy.addText(title);
  t.font = labelFont(11);
  t.textColor = COLORS.muted;

  copy.addSpacer(3);

  const name = copy.addText(label);
  name.font = labelFont(16);
  name.textColor = COLORS.ink;

  intro.addSpacer();

  const value = intro.addText(percentText(windowData));
  value.font = titleFont(44);
  value.textColor = COLORS.ink;
  value.lineLimit = 1;
  value.minimumScaleFactor = 0.58;

  block.addSpacer(10);
  addMuseumRail(block, windowData, 292, 5);
  block.addSpacer(9);

  const row = block.addStack();
  row.layoutHorizontally();
  addMuseumSpec(row, "Remaining", percentText(windowData), 68);
  addMuseumSpec(row, "Used", usedText(windowData), 54);
  addMuseumSpec(row, "Reset in", durationText(windowData?.resetAfterSeconds), 76);
  addMuseumSpec(row, "Reset at", resetAtText(windowData), 88);
}

function addMuseumSpec(parent, label, value, width) {
  const block = parent.addStack();
  block.layoutVertically();
  block.size = new Size(width, 32);

  const l = block.addText(label);
  l.font = labelFont(9);
  l.textColor = COLORS.muted;
  l.lineLimit = 1;

  block.addSpacer(2);

  const v = block.addText(value);
  v.font = labelFont(11);
  v.textColor = COLORS.ink;
  v.lineLimit = 1;
  v.minimumScaleFactor = 0.64;
}

function addMuseumRail(parent, windowData, width, height) {
  const raw = Number(windowData?.remainingPercent);
  const value = clampedPercent(raw);
  const context = new DrawContext();
  context.size = new Size(width, height + 8);
  context.opaque = false;
  context.respectScreenScale = true;

  roundedRect(context, 0, 4, width, height, height / 2, COLORS.rule);
  if (Number.isFinite(raw) && value > 0) {
    const fillWidth = Math.max(height, width * value / 100);
    roundedRect(context, 0, 4, fillWidth, height, height / 2, COLORS.accent);
    ellipse(context, Math.min(width - 8, Math.max(0, fillWidth - 4)), 0, 8, 8, COLORS.accent);
  }

  const image = parent.addImage(context.getImage());
  image.imageSize = new Size(width, height + 8);
}

function addFineRule(parent, width) {
  const line = parent.addStack();
  line.backgroundColor = COLORS.rule;
  line.size = new Size(width, 1);
}

function addFooter(parent, payload) {
  const text = parent.addText(payload.stale ? `Sync ${payload.status || "stale"}` : `Updated ${updatedText(payload.updatedAtLocal) || "--"}`);
  text.font = labelFont(9);
  text.textColor = payload.stale ? COLORS.alert : COLORS.muted;
  text.lineLimit = 1;
}

function addLargeFooter(parent, payload) {
  const row = parent.addStack();
  row.layoutHorizontally();
  const updated = row.addText(payload.stale ? `Sync ${payload.status || "stale"}` : `Updated ${updatedText(payload.updatedAtLocal) || "--"}`);
  updated.font = labelFont(9);
  updated.textColor = payload.stale ? COLORS.alert : COLORS.muted;
  row.addSpacer();
  const refresh = row.addText(`Refresh ${REFRESH_AFTER_MINUTES} min`);
  refresh.font = labelFont(9);
  refresh.textColor = COLORS.muted;
}

function roundedRect(context, x, y, width, height, radius, color) {
  const path = new Path();
  path.addRoundedRect(new Rect(x, y, width, height), radius, radius);
  context.addPath(path);
  context.setFillColor(color);
  context.fillPath();
}

function ellipse(context, x, y, width, height, color) {
  const path = new Path();
  path.addEllipse(new Rect(x, y, width, height));
  context.addPath(path);
  context.setFillColor(color);
  context.fillPath();
}

function percentText(windowData) {
  const value = Number(windowData?.remainingPercent);
  return Number.isFinite(value) ? `${Math.round(value)}%` : "--";
}

function usedText(windowData) {
  const value = Number(windowData?.usedPercent);
  return Number.isFinite(value) ? `${Math.round(value)}%` : "--";
}

function clampedPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, number));
}

function durationText(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value)) return "--";
  const total = Math.max(0, Math.round(value));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.max(0, Math.round((total % 3600) / 60));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function resetAtText(windowData) {
  const value = windowData?.resetAt;
  if (!value) return "--";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "--";
  return `${weekday(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function updatedText(value) {
  const match = String(value || "").match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

function weekday(date) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function fallbackPayload(reason) {
  return {
    stale: true,
    status: reason,
    updatedAtLocal: "",
    fiveHour: { remainingPercent: null, usedPercent: null, resetAt: null, resetAfterSeconds: null },
    weekly: { remainingPercent: null, usedPercent: null, resetAt: null, resetAfterSeconds: null },
    display: { short: "Codex --", line1: "5h --", line2: "W --" },
  };
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
