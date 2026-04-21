import WidgetKit
import SwiftUI

// MARK: - Data Model

struct WidgetCardData: Codable {
    let id: String
    let title: String
    let description: String
    let icon: String
}

struct WidgetData: Codable {
    let temp: Int
    let feelsLike: Int
    let tempDisplay: String?
    let feelsLikeDisplay: String?
    let tempUnit: String?
    let condition: String
    let conditionLabel: String
    let conditionEmoji: String
    let locationName: String
    let district: String
    let heroMessage: String
    let textureKey: String
    let updatedAt: Double
    let cards: [WidgetCardData]?
    let aiSummary: String?
    let artStyle: String?
    let glassMode: Bool?
    let predictionStreak: Int?

    var tempText: String { tempDisplay ?? "\(temp)°" }
    var feelsLikeText: String { feelsLikeDisplay ?? "\(feelsLike)°" }
    var isGlass: Bool { glassMode ?? false }
}

// MARK: - Timeline

struct MalgeumEntry: TimelineEntry {
    let date: Date
    let data: WidgetData?
}

struct MalgeumTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> MalgeumEntry {
        MalgeumEntry(date: .now, data: Self.sampleData)
    }

    func getSnapshot(in context: Context, completion: @escaping (MalgeumEntry) -> Void) {
        if context.isPreview {
            completion(placeholder(in: context))
        } else {
            completion(loadEntry())
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<MalgeumEntry>) -> Void) {
        let entry = loadEntry()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: .now)!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    static let sampleData = WidgetData(
        temp: 22, feelsLike: 20,
        tempDisplay: "22°", feelsLikeDisplay: "20°", tempUnit: "C",
        condition: "clear",
        conditionLabel: "맑음", conditionEmoji: "☀️",
        locationName: "서울 강남구", district: "강남구",
        heroMessage: "외출하기 좋아요", textureKey: "sunny",
        updatedAt: Date().timeIntervalSince1970 * 1000,
        cards: [
            WidgetCardData(id: "1", title: "우산 불필요", description: "", icon: "umbrella"),
            WidgetCardData(id: "2", title: "자외선 보통", description: "", icon: "sun"),
        ],
        aiSummary: "오늘 같은 날 보고 싶어",
        artStyle: "klimt", glassMode: false,
        predictionStreak: 7
    )

    private func loadEntry() -> MalgeumEntry {
        guard let defaults = UserDefaults(suiteName: "group.gg.pryzm.malgeum"),
              let jsonString = defaults.string(forKey: "widgetData"),
              let jsonData = jsonString.data(using: .utf8),
              let data = try? JSONDecoder().decode(WidgetData.self, from: jsonData) else {
            return MalgeumEntry(date: .now, data: Self.sampleData)
        }
        return MalgeumEntry(date: .now, data: data)
    }
}

// MARK: - Art Style Theme

struct WidgetTheme {
    let bg: Color
    let accent: Color
}

func artStyleTheme(for style: String) -> WidgetTheme {
    switch style {
    case "vangogh":     return WidgetTheme(bg: Color(hex: "0E2559"), accent: Color(hex: "F0C020"))
    case "monet":       return WidgetTheme(bg: Color(hex: "2A5F6C"), accent: Color(hex: "A8D8E8"))
    case "klimt":       return WidgetTheme(bg: Color(hex: "2C1A0E"), accent: Color(hex: "D4A017"))
    case "gauguin":     return WidgetTheme(bg: Color(hex: "5C2200"), accent: Color(hex: "F0A030"))
    case "popart":      return WidgetTheme(bg: Color(hex: "B50000"), accent: Color(hex: "FFE400"))
    case "bauhaus":     return WidgetTheme(bg: Color(hex: "1C2D5A"), accent: Color(hex: "E63946"))
    case "ukiyo":       return WidgetTheme(bg: Color(hex: "1A2456"), accent: Color(hex: "C9B8E8"))
    case "mucha":       return WidgetTheme(bg: Color(hex: "3D2B1F"), accent: Color(hex: "C9A96E"))
    case "synthwave":   return WidgetTheme(bg: Color(hex: "1A0533"), accent: Color(hex: "FF2D78"))
    case "risograph":   return WidgetTheme(bg: Color(hex: "3D1F4E"), accent: Color(hex: "F25C8A"))
    case "dblexposure": return WidgetTheme(bg: Color(hex: "1A2B1A"), accent: Color(hex: "7ED8A4"))
    case "kaws":        return WidgetTheme(bg: Color(hex: "1A1A2E"), accent: Color(hex: "FF6B9D"))
    case "basquiat":    return WidgetTheme(bg: Color(hex: "1A1A1A"), accent: Color(hex: "FF5F1F"))
    case "hockney":     return WidgetTheme(bg: Color(hex: "0A4A8A"), accent: Color(hex: "FF9F40"))
    case "louiswain":   return WidgetTheme(bg: Color(hex: "1F1030"), accent: Color(hex: "A78BFA"))
    default:            return WidgetTheme(bg: Color(hex: "1E293B"), accent: Color(hex: "90C4DC"))
    }
}

// MARK: - Widget Background
// containerBackground(for:) 에 전달하는 배경 뷰 (iOS 17+)
// iOS 16 이하에서는 ZStack 첫 번째 레이어로 사용

struct WidgetBackground: View {
    let data: WidgetData?

    private var style: String { data?.artStyle ?? "default" }
    private var texture: String { data?.textureKey ?? "sunny" }
    private var imageName: String { "widget_\(style)_\(texture)" }

    var body: some View {
        if let data = data, data.isGlass {
            Color.black.opacity(0.35)
        } else {
            let theme = artStyleTheme(for: style)
            ZStack {
                // 아트웍 이미지 or 그라데이션 폴백
                if let uiImage = UIImage(named: imageName) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } else {
                    LinearGradient(
                        colors: [theme.bg, theme.bg.opacity(0.75)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                }
                // 다크 스크림 (상단 투명 → 하단 진하게)
                LinearGradient(
                    colors: [
                        Color.black.opacity(0.0),
                        Color.black.opacity(0.25),
                        Color.black.opacity(0.60),
                    ],
                    startPoint: .top,
                    endPoint: .bottom
                )
                // accent glow (하단 트레일링)
                RadialGradient(
                    colors: [theme.accent.opacity(0.28), .clear],
                    center: .bottomTrailing,
                    startRadius: 10,
                    endRadius: 200
                )
            }
        }
    }
}

// MARK: - Shared UI Components

struct HeroPill: View {
    let text: String
    let accent: Color

    var body: some View {
        Text(text)
            .font(.system(size: 11, weight: .bold, design: .rounded))
            .foregroundColor(.white)
            .padding(.horizontal, 9)
            .padding(.vertical, 4)
            .background(accent.opacity(0.38))
            .clipShape(Capsule())
    }
}

struct ActionPill: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.system(size: 10, weight: .semibold))
            .foregroundColor(.white.opacity(0.9))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Color.white.opacity(0.13))
            .clipShape(Capsule())
    }
}

// MARK: - Small Widget Content

struct SmallWidgetContent: View {
    let data: WidgetData?

    var body: some View {
        if let data = data {
            let theme = artStyleTheme(for: data.artStyle ?? "default")
            VStack(alignment: .leading, spacing: 0) {
                // 상단: 지역명 + streak 배지
                HStack(alignment: .center, spacing: 0) {
                    Text(data.district)
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white.opacity(0.65))
                    Spacer()
                    if let streak = data.predictionStreak, streak >= 2 {
                        Text("🔥\(streak)")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(Color(hex: "FBBF24"))
                    }
                }

                Spacer()

                // 중앙: 이모지 + 온도
                Text(data.conditionEmoji)
                    .font(.system(size: 26))
                Text(data.tempText)
                    .font(.system(size: 42, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                    .minimumScaleFactor(0.7)

                Spacer()

                // 하단: hero pill
                HeroPill(text: data.heroMessage, accent: theme.accent)
            }
            .padding(14)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        } else {
            VStack(spacing: 4) {
                Text("☀️").font(.system(size: 30))
                Text("맑음")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                Text("앱을 열어 설정하세요")
                    .font(.system(size: 10))
                    .foregroundColor(.white.opacity(0.5))
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

// MARK: - Medium Widget Content

struct MediumWidgetContent: View {
    let data: WidgetData?

    var body: some View {
        if let data = data {
            let theme = artStyleTheme(for: data.artStyle ?? "default")
            VStack(alignment: .leading, spacing: 0) {

                // 상단: 이모지 + 위치 + hero pill
                HStack(alignment: .center, spacing: 0) {
                    HStack(spacing: 5) {
                        Text(data.conditionEmoji)
                            .font(.system(size: 15))
                        VStack(alignment: .leading, spacing: 1) {
                            Text(data.locationName)
                                .font(.system(size: 13, weight: .semibold))
                                .foregroundColor(.white.opacity(0.85))
                                .lineLimit(1)
                            Text(data.conditionLabel)
                                .font(.system(size: 10))
                                .foregroundColor(.white.opacity(0.45))
                        }
                    }
                    Spacer()
                    HeroPill(text: data.heroMessage, accent: theme.accent)
                }

                Spacer()

                // 하단: 온도(좌) + action pills(우)
                HStack(alignment: .bottom, spacing: 0) {
                    // 온도 + 체감
                    VStack(alignment: .leading, spacing: 0) {
                        Text(data.tempText)
                            .font(.system(size: 46, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                            .minimumScaleFactor(0.7)
                            .lineLimit(1)
                        // AI 한마디
                        if let ai = data.aiSummary, !ai.isEmpty {
                            Text(ai)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(.white.opacity(0.5))
                                .lineLimit(1)
                                .padding(.top, 2)
                        }
                    }

                    Spacer()

                    // action pill 스택 (최대 2개)
                    VStack(alignment: .trailing, spacing: 4) {
                        if let cards = data.cards, !cards.isEmpty {
                            ForEach(cards.prefix(2), id: \.id) { card in
                                ActionPill(text: card.title)
                            }
                        }
                    }
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        } else {
            VStack(spacing: 4) {
                Text("맑음")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                Text("앱을 열어 설정하세요")
                    .font(.system(size: 12))
                    .foregroundColor(.white.opacity(0.5))
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

// MARK: - Large Widget Content

struct LargeWidgetContent: View {
    let data: WidgetData?

    var body: some View {
        if let data = data {
            let theme = artStyleTheme(for: data.artStyle ?? "default")
            VStack(alignment: .leading, spacing: 10) {

                // Header: 위치 + hero pill
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        HStack(spacing: 4) {
                            Text(data.conditionEmoji).font(.system(size: 13))
                            Text(data.locationName)
                                .font(.system(size: 12, weight: .medium))
                                .foregroundColor(.white.opacity(0.7))
                        }
                        HStack(alignment: .firstTextBaseline, spacing: 6) {
                            Text(data.tempText)
                                .font(.system(size: 42, weight: .bold, design: .rounded))
                                .foregroundColor(.white)
                            Text("체감 \(data.feelsLikeText)")
                                .font(.system(size: 12))
                                .foregroundColor(.white.opacity(0.45))
                        }
                    }
                    Spacer()
                    HeroPill(text: data.heroMessage, accent: theme.accent)
                }

                // AI 한마디
                if let ai = data.aiSummary, !ai.isEmpty {
                    HStack(spacing: 6) {
                        Text("✦")
                            .font(.system(size: 10))
                            .foregroundColor(theme.accent.opacity(0.8))
                        Text(ai)
                            .font(.system(size: 11, weight: .medium))
                            .foregroundColor(.white.opacity(0.65))
                            .lineLimit(2)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 7)
                    .background(Color.white.opacity(0.07))
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                }

                // 액션카드
                if let cards = data.cards, !cards.isEmpty {
                    VStack(spacing: 4) {
                        ForEach(cards.prefix(4), id: \.id) { card in
                            HStack(spacing: 8) {
                                Image(systemName: cardSFSymbol(card.icon))
                                    .font(.system(size: 12, weight: .medium))
                                    .foregroundColor(theme.accent.opacity(0.8))
                                    .frame(width: 20)
                                VStack(alignment: .leading, spacing: 0) {
                                    Text(card.title)
                                        .font(.system(size: 11, weight: .semibold))
                                        .foregroundColor(.white.opacity(0.9))
                                    Text(card.description)
                                        .font(.system(size: 9))
                                        .foregroundColor(.white.opacity(0.35))
                                        .lineLimit(1)
                                }
                                Spacer()
                            }
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.white.opacity(0.07))
                            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                        }
                    }
                } else {
                    HStack(spacing: 12) {
                        InfoPill(label: "날씨", value: data.conditionLabel, accent: theme.accent)
                        InfoPill(label: "체감", value: data.feelsLikeText, accent: theme.accent)
                    }
                }

                Spacer(minLength: 0)

                Text("맑음 — 날씨를 보지 말고, 물어보세요")
                    .font(.system(size: 9))
                    .foregroundColor(.white.opacity(0.2))
            }
            .padding(16)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        } else {
            VStack(spacing: 6) {
                Text("☀️").font(.system(size: 36))
                Text("맑음")
                    .font(.system(size: 22, weight: .bold, design: .rounded))
                    .foregroundColor(.white)
                Text("앱을 열어 설정하세요")
                    .font(.system(size: 12))
                    .foregroundColor(.white.opacity(0.5))
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

struct InfoPill: View {
    let label: String
    let value: String
    let accent: Color

    var body: some View {
        VStack(spacing: 2) {
            Text(label)
                .font(.system(size: 9))
                .foregroundColor(.white.opacity(0.4))
            Text(value)
                .font(.system(size: 13, weight: .semibold, design: .rounded))
                .foregroundColor(.white)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 7)
        .background(Color.white.opacity(0.07))
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

// MARK: - Phosphor → SF Symbol

func cardSFSymbol(_ phosphorKey: String) -> String {
    switch phosphorKey {
    case "t-shirt":             return "tshirt"
    case "coat-hanger":         return "hanger"
    case "umbrella":            return "umbrella"
    case "sun":                 return "sun.max"
    case "mask-sad":            return "facemask"
    case "person-simple-run":   return "figure.run"
    case "barbell":             return "dumbbell"
    case "car":                 return "car"
    case "person-simple-walk":  return "figure.walk"
    case "basket":              return "basket"
    case "heart":               return "heart"
    case "wind":                return "wind"
    case "flower":              return "leaf"
    default:                    return "info.circle"
    }
}

// MARK: - Widget Configurations
// iOS 17+: containerBackground로 배경 처리 → 프레임리스, 코너 클리핑 자동
// iOS 16-: ZStack으로 직접 배경 깔기

struct MalgeumSmallWidget: Widget {
    let kind: String = "MalgeumSmall"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MalgeumTimelineProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                SmallWidgetContent(data: entry.data)
                    .widgetURL(URL(string: "malgeum://home"))
                    .containerBackground(for: .widget) {
                        WidgetBackground(data: entry.data)
                    }
            } else {
                ZStack {
                    WidgetBackground(data: entry.data)
                    SmallWidgetContent(data: entry.data)
                }
                .widgetURL(URL(string: "malgeum://home"))
            }
        }
        .configurationDisplayName("맑음")
        .description("날씨와 행동 추천")
        .supportedFamilies([.systemSmall])
    }
}

struct MalgeumMediumWidget: Widget {
    let kind: String = "MalgeumMedium"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MalgeumTimelineProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                MediumWidgetContent(data: entry.data)
                    .widgetURL(URL(string: "malgeum://home"))
                    .containerBackground(for: .widget) {
                        WidgetBackground(data: entry.data)
                    }
            } else {
                ZStack {
                    WidgetBackground(data: entry.data)
                    MediumWidgetContent(data: entry.data)
                }
                .widgetURL(URL(string: "malgeum://home"))
            }
        }
        .configurationDisplayName("맑음 상세")
        .description("날씨 상세와 행동 추천")
        .supportedFamilies([.systemMedium])
    }
}

struct MalgeumLargeWidget: Widget {
    let kind: String = "MalgeumLarge"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MalgeumTimelineProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                LargeWidgetContent(data: entry.data)
                    .widgetURL(URL(string: "malgeum://home"))
                    .containerBackground(for: .widget) {
                        WidgetBackground(data: entry.data)
                    }
            } else {
                ZStack {
                    WidgetBackground(data: entry.data)
                    LargeWidgetContent(data: entry.data)
                }
                .widgetURL(URL(string: "malgeum://home"))
            }
        }
        .configurationDisplayName("맑음 전체")
        .description("날씨 + 체감온도 + 행동 추천 한눈에")
        .supportedFamilies([.systemLarge])
    }
}

// MARK: - Lock Screen Views

struct LockCircularView: View {
    let data: WidgetData?

    var body: some View {
        if let data = data {
            VStack(spacing: 1) {
                Text(data.conditionEmoji)
                    .font(.system(size: 22))
                    .widgetAccentable()
                Text(data.tempText)
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .widgetAccentable()
            }
        } else {
            Text("☀️").font(.system(size: 26))
        }
    }
}

struct LockRectangularView: View {
    let data: WidgetData?

    var body: some View {
        if let data = data {
            HStack(spacing: 10) {
                Text(data.conditionEmoji)
                    .font(.system(size: 30))
                    .widgetAccentable()
                VStack(alignment: .leading, spacing: 2) {
                    Text(data.tempText)
                        .font(.system(size: 22, weight: .bold, design: .rounded))
                        .widgetAccentable()
                    Text(data.heroMessage)
                        .font(.system(size: 12, weight: .medium))
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                }
                Spacer()
            }
        } else {
            Text("☀️").font(.system(size: 26))
        }
    }
}

struct LockInlineView: View {
    let data: WidgetData?

    var body: some View {
        if let data = data {
            Text("\(data.conditionEmoji) \(data.tempText) · \(data.conditionLabel)")
                .widgetAccentable()
        } else {
            Text("☀️ 날씨 로딩 중")
        }
    }
}

// MARK: - Lock Screen Widget

struct MalgeumLockEntryView: View {
    let entry: MalgeumEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .accessoryCircular:
            LockCircularView(data: entry.data)
        case .accessoryRectangular:
            LockRectangularView(data: entry.data)
        case .accessoryInline:
            LockInlineView(data: entry.data)
        default:
            EmptyView()
        }
    }
}

struct MalgeumLockWidget: Widget {
    let kind: String = "MalgeumLock"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MalgeumTimelineProvider()) { entry in
            if #available(iOSApplicationExtension 17.0, *) {
                MalgeumLockEntryView(entry: entry)
                    .containerBackground(.clear, for: .widget)
            } else {
                MalgeumLockEntryView(entry: entry)
            }
        }
        .configurationDisplayName("맑음 잠금화면")
        .description("잠금화면에서 날씨를 한눈에 확인")
        .supportedFamilies([
            .accessoryCircular,
            .accessoryRectangular,
            .accessoryInline,
        ])
    }
}

@main
struct MalgeumWidgetBundle: WidgetBundle {
    var body: some Widget {
        MalgeumSmallWidget()
        MalgeumMediumWidget()
        MalgeumLargeWidget()
        MalgeumLockWidget()
    }
}

// MARK: - Color Hex Extension

extension Color {
    init(hex: String) {
        let scanner = Scanner(string: hex)
        var rgbValue: UInt64 = 0
        scanner.scanHexInt64(&rgbValue)
        self.init(
            red: Double((rgbValue >> 16) & 0xFF) / 255.0,
            green: Double((rgbValue >> 8) & 0xFF) / 255.0,
            blue: Double(rgbValue & 0xFF) / 255.0
        )
    }
}
