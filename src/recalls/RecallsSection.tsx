import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { Panel } from "../design/Surface";
import { Badge } from "../design/Badge";
import { tokens } from "../design/tokens";
import { formatDate, t } from "../i18n";
import { track } from "../analytics";
import { cachedRecalls, lookupRecalls, NHTSA_VIN_URL, type Recall, type RecallResult } from "./index";

type VehicleLike = { id: string; make?: string; model?: string; year?: number };

/**
 * The vehicle screen's recall section. Draws the cached answer at once and
 * refreshes it behind; draws nothing at all when there is nothing to ask
 * with, the phone is outside the US, NHTSA does not list the model, or the
 * lookup failed with nothing cached.
 */
export function RecallsSection({ vehicle }: { vehicle: VehicleLike }) {
  const [result, setResult] = useState<RecallResult | null>(
    () => cachedRecalls(vehicle)?.result ?? null
  );
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    lookupRecalls(vehicle)
      .then((r) => {
        if (live) setResult(r);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [vehicle.make, vehicle.model, vehicle.year]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!result || result.status === "unavailable") return null;
  const name = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ");

  return (
    <View style={{ gap: tokens.space.xs }}>
      <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>
        {t("vehicle.recalls.legend")}
      </Text>
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
          <Text style={{ ...tokens.text.body, color: tokens.color.text }}>
            {result.status === "found"
              ? t("vehicle.recalls.found", { count: result.recalls.length, vehicle: name })
              : t("vehicle.recalls.none", { vehicle: name })}
          </Text>
          {result.status === "found" &&
            result.recalls.map((recall) => (
              <RecallRow
                key={recall.campaign}
                recall={recall}
                expanded={open === recall.campaign}
                onToggle={() => {
                  const next = open === recall.campaign ? null : recall.campaign;
                  if (next) track("recall_opened", { campaign: recall.campaign, park_it: recall.parkIt });
                  setOpen(next);
                }}
              />
            ))}
          {result.status === "found" && (
            <Pressable
              onPress={() => {
                track("recall_vin_check");
                Linking.openURL(NHTSA_VIN_URL).catch(() => {});
              }}
            >
              <Text style={{ ...tokens.text.legend, color: tokens.color.text }}>
                {t("vehicle.recalls.check")}
              </Text>
            </Pressable>
          )}
          <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>
            {t("vehicle.recalls.note")}
          </Text>
        </View>
      </Panel>
    </View>
  );
}

function RecallRow({
  recall,
  expanded,
  onToggle,
}: {
  recall: Recall;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={{ gap: tokens.space.xs }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: tokens.space.sm }}>
        <Text style={{ ...tokens.text.body, color: tokens.color.text, flex: 1 }}>{recall.component}</Text>
        {recall.parkIt ? (
          <Badge label={t("vehicle.recalls.parkIt")} tone="due" />
        ) : (
          <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
            {expanded ? t("vehicle.recalls.hide") : t("vehicle.recalls.details")}
          </Text>
        )}
      </View>
      {recall.reportedAt && (
        <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>
          {`${recall.campaign} · ${formatDate(recall.reportedAt)}`}
        </Text>
      )}
      <Text
        style={{ ...tokens.text.caption, color: tokens.color.textMuted }}
        numberOfLines={expanded ? undefined : 2}
      >
        {recall.summary}
      </Text>
      {expanded && recall.consequence !== "" && (
        <Detail label={t("vehicle.recalls.risk")} body={recall.consequence} />
      )}
      {expanded && recall.remedy !== "" && (
        <Detail label={t("vehicle.recalls.remedy")} body={recall.remedy} />
      )}
    </Pressable>
  );
}

function Detail({ label, body }: { label: string; body: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>{label}</Text>
      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>{body}</Text>
    </View>
  );
}
