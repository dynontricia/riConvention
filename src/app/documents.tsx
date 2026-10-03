import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';

// ─── DATA ────────────────────────────────────────────────────────────────────

const businessAgendaItems = [
  'Meeting Call to Order',
  'Open with Serenity Prayer and Declaration of Unity',
  'Business Meeting Procedures by Parliamentarian',
  "Secretary's Report 2026",
  'Financial Report 2026',
  'Inventory Committee Report',
  'Announcements from the Northeast Regional Trustee',
  'Intention to Bid for 2030',
  'Old Business: Ad hoc to Establish Archivist Status Report',
  'Call for New Business',
  'Close with Responsibility Statement',
];

const minutesMotions = [
  {
    mover: 'Bill W.',
    motion: "That the Delegates luncheon be discontinued and opened to all starting in 2028.",
    result: 'Passed. Motion to Reconsider failed (87 in favor, 121 opposed).',
  },
  {
    mover: 'Bill W.',
    motion: 'That Guidelines state registration forms be in PDF format to NERD Delegates.',
    result: 'Passed. Motion to Reconsider failed (3 in favor, all else opposed).',
  },
  {
    mover: 'Lisa (Host Committee)',
    motion: 'That Guidelines on Roundtables #7 be moderated by the Regional Trustee.',
    result: 'Passed. Motion to Reconsider failed (27 in favor, all else opposed).',
  },
  {
    mover: 'Barb C.',
    motion: 'That the Inventory Ad hoc be allotted $300 starting 2028 for tracking digital feedback, a digital platform for committee meetings, translation services, and printing/distribution of surveys and final reports.',
    result: 'Passed unanimously.',
  },
];

const financialsHotel = [
  { label: 'Meals — Friday Night', amount: '$1,000.00' },
  { label: 'Meals — Saturday Breakfast', amount: '$7,258.80' },
  { label: 'Meals — Delegates Lunch', amount: '$4,428.00' },
  { label: 'Meals — Banquet', amount: '$22,779.60' },
  { label: 'Meals — Sunday Breakfast', amount: '$6,265.20' },
  { label: 'Coffee', amount: '$22,500.00' },
  { label: 'Supplemental', amount: '$200.00' },
  { label: 'Rooms', amount: '$1,251.00' },
  { label: 'Room Rebate (credit)', amount: '($2,217.58)' },
  { label: 'Hotel Subtotal', amount: '$73,703.82', bold: true },
];

const financialsCommittee = [
  { label: 'NERT Expenses', amount: '$150.00' },
  { label: 'Speaker Expenses', amount: '$150.00' },
  { label: 'Lanyards', amount: '$960.00' },
  { label: 'Badges', amount: '$1,000.00' },
  { label: 'Position Ribbons', amount: '$200.00' },
  { label: 'Hospitality Room', amount: '$2,815.00' },
  { label: 'Chair Expenses', amount: '$161.74' },
  { label: 'Treasurer/Alt', amount: '$38.00' },
  { label: 'Registrar', amount: '$111.15' },
  { label: 'Technology', amount: '$195.00' },
  { label: 'Programs', amount: '$1,660.12' },
  { label: 'Inventory Committee', amount: '$550.00' },
  { label: 'Archives', amount: '$48.60' },
  { label: 'Committee Subtotal', amount: '$8,039.61', bold: true },
];

const financialsSummary = [
  { label: 'Total Expenses', amount: '$81,743.43', bold: true },
  { label: 'Gross Registrations', amount: '$77,418.60' },
  { label: 'From Area', amount: '$6,000.00' },
  { label: 'Total Income', amount: '$83,418.60', bold: true },
  { label: 'Surplus', amount: '$1,675.17', bold: true },
  { label: 'Seed Money to be Sent', amount: '$6,000.00' },
  { label: 'Requested from Area', amount: '$4,324.83' },
];


// ─── HELPERS ─────────────────────────────────────────────────────────────────

function SectionHeader({ text }: { text: string }) {
  return (
      <ThemedText type="defaultSemiBold" style={{ marginTop: Spacing.three, marginBottom: Spacing.one }}>
        {text}
      </ThemedText>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
      <View style={{ gap: Spacing.one }}>
        {items.map((item, index) => (
            <View key={index} style={{ flexDirection: 'row', gap: Spacing.two }}>
              <ThemedText type="small">•</ThemedText>
              <ThemedText type="small" style={{ flex: 1 }}>{item}</ThemedText>
            </View>
        ))}
      </View>
  );
}

function FinancialRow({ label, amount, bold }: { label: string; amount: string; bold?: boolean }) {
  return (
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
        <ThemedText type="small" style={{ flex: 1, fontWeight: bold ? '600' : '400' }}>{label}</ThemedText>
        <ThemedText type="small" style={{ fontWeight: bold ? '600' : '400' }}>{amount}</ThemedText>
      </View>
  );
}

function Divider({ color }: { color: string }) {
  return <View style={{ height: 1, backgroundColor: color, marginVertical: Spacing.two }} />;
}

// ─── SCREEN ──────────────────────────────────────────────────────────────────

export default function DocumentsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
      <ScrollView
          style={[styles.scrollView, { backgroundColor: theme.background }]}
          contentInset={insets}
          contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
        <ThemedView style={styles.container}>

          {/* Header */}
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="subtitle">Documents</ThemedText>
            <ThemedText style={styles.centerText} themeColor="textSecondary">
              The guidelines require that every attendee have access to the following documents.
            </ThemedText>
            <ExternalLink href="https://drive.google.com/drive/folders/1EGJejpHtnU6FzXRwe6CuuWn64Pba9XT0?usp=sharing" asChild>
              <Pressable style={({ pressed }) => pressed && styles.pressed}>
                <ThemedView type="backgroundElement" style={styles.linkButton}>
                  <ThemedText type="link">Google Folder for Documents</ThemedText>
                  <SymbolView
                      tintColor={theme.text}
                      name={{ ios: 'arrow.up.right.square', android: 'link', web: 'link' }}
                      size={12}
                  />
                </ThemedView>
              </Pressable>
            </ExternalLink>
          </ThemedView>

          <ThemedView style={styles.sectionsWrapper}>

            {/* 1. Business Meeting Agenda */}
            {/*<Collapsible title="Business Meeting Agenda">
              <ThemedText type="defaultSemiBold">
                {'2027\nBusiness Meeting Agenda\nFebruary 24, 2027  3:30–5:00 pm\nOmni Providence'}
              </ThemedText>
              <View style={{ marginTop: Spacing.two }}>
              </View>
            </Collapsible>*/}

            {/* 2. Business Meeting Minutes */}
            {/*<Collapsible title="Business Meeting Minutes 2026">
              <ThemedText type="defaultSemiBold"> 2026 Business Meeting Minutes</ThemedText>
              <ThemedText type="small" style={{ marginTop: Spacing.one }}>
                Meeting opened by Don S. Procedures read by Parliamentarian Deb D.
              </ThemedText>

              <SectionHeader text="Reports" />
              <BulletList items={[
                "Secretary's Minutes presented by Bill W. Motion to waive reading — passed unanimously.",
                "Financial report of 2026 given by Jon C.: $3,000 seed money received, $1,000 Hospitality, $6,000 seed money returned, $7,456.52 contribution to General Service Board. Motion to approve — passed unanimously.",
                "No additional announcements from the Northeast Regional Trustee.",
                "Areas intending to bid for 2030: Area 28 (Maine) & Area 45 (So. Jersey).",
                "Old Business — Ad hoc to establish Archivist: Russell (Area 13, D.C.) reported the committee met 5 times and is considering a 6-year term, responsibilities, costs, and domain registration.",
              ]} />

              <SectionHeader text="New Business — Motions" />
              <View style={{ gap: Spacing.three }}>
                {minutesMotions.map((m, index) => (
                    <View key={index} style={{ gap: Spacing.one }}>
                      <ThemedText type="small" style={{ fontWeight: '600' }}>
                        Motion {index + 1} — {m.mover}
                      </ThemedText>
                      <ThemedText type="small">{m.motion}</ThemedText>
                      <ThemedText type="small" style={{ fontStyle: 'italic' }}>
                        Result: {m.result}
                      </ThemedText>
                    </View>
                ))}
              </View>

              <ThemedText type="small" style={{ marginTop: Spacing.three }}>
                Chair read the Responsibility Declaration and closed the meeting at 10:15 PM.
              </ThemedText>
              <ThemedText type="small" style={{ marginTop: Spacing.one, fontStyle: 'italic' }}>
                In Fellowship and Service,{'\n'}Steve O., 2026 Secretary
              </ThemedText>
            </Collapsible>*/}

            {/* 3. Treasurer's Report */}
            {/*<Collapsible title="Treasurer's Report 2026">
              <ThemedText type="defaultSemiBold">2026 Financial Report</ThemedText>
              <ThemedText type="small" style={{ marginTop: Spacing.one, marginBottom: Spacing.two }} themeColor="textSecondary">
                Desmond Hotel — February 2026
              </ThemedText>

              <SectionHeader text="Hotel Expenses" />
              {financialsHotel.map((row, i) => (
                  <FinancialRow key={i} {...row} />
              ))}

              <Divider color={theme.backgroundSelected} />

              <SectionHeader text="Committee Expenses" />
              {financialsCommittee.map((row, i) => (
                  <FinancialRow key={i} {...row} />
              ))}

              <Divider color={theme.backgroundSelected} />

              <SectionHeader text="Summary" />
              {financialsSummary.map((row, i) => (
                  <FinancialRow key={i} {...row} />
              ))}
            </Collapsible>*/}

          </ThemedView>
        </ThemedView>
      </ScrollView>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  linkButton: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    justifyContent: 'center',
    gap: Spacing.one,
    alignItems: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.four,
  },
});