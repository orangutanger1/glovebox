import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import { Screen } from "../src/design/Screen";
import { Card } from "../src/design/Card";
import { ListRow } from "../src/design/ListRow";
import { tokens } from "../src/design/tokens";
import { LANGUAGES, getLanguage, setLanguage, t, type Language } from "../src/i18n";
import { LANGUAGE_NAMES } from "../src/i18n/names";
import {
  getLanguagePreference,
  setLanguagePreference,
  bootLanguage,
} from "../src/i18n/preference";
import { notifyLocaleChanged } from "../src/i18n/epoch";

/**
 * The language picker.
 *
 * iOS has one of its own, per app, in Settings — but it only lists what the
 * bundle declares and it sends the user out of the app to find it. The people
 * who need this row are the ones the OS switch serves worst: an owner whose
 * phone is in one language and whose car paperwork is in another, and anyone
 * checking what the app says in a language they are about to recommend it in.
 *
 * "System" is a first-class choice rather than the absence of one, so that
 * picking it again later actually gives the phone back control instead of
 * leaving the last explicit choice in place forever.
 */
export default function LanguagePicker() {
  const router = useRouter();
  const active = getLanguage();
  const explicit = getLanguagePreference();

  function choose(language: Language | "system") {
    setLanguagePreference(language);
    // Resolved rather than assumed: "system" has to go back through the phone's
    // preference list, and that is exactly what boot does.
    if (language === "system") bootLanguage();
    else setLanguage(language);
    notifyLocaleChanged();
    router.back();
  }

  return (
    <Screen title={t("language.title")}>
      <Card>
        <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
          {t("language.intro")}
        </Text>
      </Card>
      <Card>
        <ListRow
          title={t("language.system")}
          subtitle={explicit === null ? LANGUAGE_NAMES[active] : undefined}
          right={explicit === null ? <Check /> : undefined}
          onPress={() => choose("system")}
        />
        {LANGUAGES.map((language) => (
          <ListRow
            key={language}
            title={LANGUAGE_NAMES[language]}
            right={explicit === language ? <Check /> : undefined}
            onPress={() => choose(language)}
          />
        ))}
      </Card>
      <View style={{ height: tokens.space.md }} />
    </Screen>
  );
}

function Check() {
  return <Text style={{ ...tokens.text.body, color: tokens.color.text }}>✓</Text>;
}
