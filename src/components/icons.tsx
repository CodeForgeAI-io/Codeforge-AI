/**
 * Font Awesome icon library — whole-project icon set.
 *
 * Lucide was replaced by Font Awesome here. Each export is a thin wrapper around
 * <FontAwesomeIcon> that keeps the Lucide-compatible props (`size`, `className`,
 * and the now-ignored `strokeWidth`) so existing call sites work unchanged.
 *
 * Auto-generated mapping — edit the generator in git history, not by hand.
 */
import type { ComponentProps } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowLeft,
  faArrowRight,
  faArrowTrendDown,
  faArrowTrendUp,
  faArrowUpRightFromSquare,
  faArrowsRotate,
  faAward,
  faBars,
  faBolt,
  faBookOpen,
  faBookmark,
  faBrain,
  faBuilding,
  faBullseye,
  faCalendar,
  faCalendarDays,
  faChartColumn,
  faChartLine,
  faCheck,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircle,
  faCircleCheck,
  faCircleDollarToSlot,
  faCircleDot,
  faCircleInfo,
  faCircleXmark,
  faClipboard,
  faClock,
  faCloudArrowUp,
  faCode,
  faCodeBranch,
  faComment,
  faCompress,
  faCreditCard,
  faCrown,
  faDatabase,
  faDesktop,
  faDownload,
  faEllipsis,
  faEnvelope,
  faExpand,
  faEye,
  faEyeSlash,
  faFileArrowUp,
  faFileCircleQuestion,
  faFileLines,
  faFire,
  faFloppyDisk,
  faGear,
  faGlobe,
  faPhone,
  faGraduationCap,
  faGripVertical,
  faHeadphones,
  faHeart,
  faLightbulb,
  faListCheck,
  faLocationDot,
  faLock,
  faMagnifyingGlass,
  faMap,
  faMedal,
  faMoon,
  faMugHot,
  faNoteSticky,
  faPaintbrush,
  faPalette,
  faPaperPlane,
  faPenToSquare,
  faPencil,
  faPlay,
  faPlus,
  faReply,
  faRightFromBracket,
  faRightToBracket,
  faRobot,
  faRocket,
  faRotateLeft,
  faSeedling,
  faShareNodes,
  faShield,
  faShieldHalved,
  faSliders,
  faSpinner,
  faSquare,
  faSquareCheck,
  faStar,
  faStopwatch,
  faSun,
  faTableCellsLarge,
  faTableColumns,
  faTag,
  faTerminal,
  faTrash,
  faTriangleExclamation,
  faTrophy,
  faUpRightFromSquare,
  faUser,
  faUserCheck,
  faUserPlus,
  faUserXmark,
  faUsers,
  faVideo,
  faWandMagicSparkles,
  faWifi,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

type FaProps = ComponentProps<typeof FontAwesomeIcon>;

export interface IconProps extends Omit<FaProps, "icon" | "size"> {
  /** Pixel size (Lucide compat). Maps to width/height + font-size. */
  size?: number | string;
  /** Ignored — Font Awesome glyphs have no stroke (Lucide compat). */
  strokeWidth?: number;
  absoluteStrokeWidth?: boolean;
}

export type LucideIcon = (props: IconProps) => React.ReactElement;
export type Icon = LucideIcon;

function make(icon: IconDefinition): LucideIcon {
  function IconComponent(props: IconProps) {
    // strokeWidth/absoluteStrokeWidth are Lucide-only props; drop them so they
    // never reach the DOM, and translate `size` into explicit dimensions.
    const { size, strokeWidth, absoluteStrokeWidth, style, ...rest } = props;
    void strokeWidth;
    void absoluteStrokeWidth;
    const sized =
      size != null
        ? { width: size, height: size, fontSize: size, ...style }
        : style;
    return <FontAwesomeIcon icon={icon} style={sized} {...rest} />;
  }
  return IconComponent;
}

export const AlarmClock = make(faClock);
export const AlertTriangle = make(faTriangleExclamation);
export const ArrowLeft = make(faArrowLeft);
export const ArrowRight = make(faArrowRight);
export const ArrowUpRight = make(faArrowUpRightFromSquare);
export const Award = make(faAward);
export const BarChart2 = make(faChartColumn);
export const BarChart3 = make(faChartColumn);
export const BookOpen = make(faBookOpen);
export const Bookmark = make(faBookmark);
export const BookmarkCheck = make(faBookmark);
export const Bot = make(faRobot);
export const Braces = make(faCode);
export const Brain = make(faBrain);
export const Building2 = make(faBuilding);
export const Calendar = make(faCalendar);
export const CalendarClock = make(faCalendarDays);
export const CalendarDays = make(faCalendarDays);
export const Check = make(faCheck);
export const CheckCircle2 = make(faCircleCheck);
export const CheckIcon = make(faCheck);
export const CheckSquare = make(faSquareCheck);
export const ChevronDown = make(faChevronDown);
export const ChevronDownIcon = make(faChevronDown);
export const ChevronLeft = make(faChevronLeft);
export const ChevronRight = make(faChevronRight);
export const ChevronRightIcon = make(faChevronRight);
export const ChevronUp = make(faChevronUp);
export const ChevronUpIcon = make(faChevronUp);
export const Circle = make(faCircle);
export const CircleCheckIcon = make(faCircleCheck);
export const CircleDollarSign = make(faCircleDollarToSlot);
export const CircleDot = make(faCircleDot);
export const CircleIcon = make(faCircle);
export const ClipboardCopy = make(faClipboard);
export const Clock = make(faClock);
export const CloudUpload = make(faCloudArrowUp);
export const Code2 = make(faCode);
export const Coffee = make(faMugHot);
export const CornerDownRight = make(faReply);
export const CreditCard = make(faCreditCard);
export const Crown = make(faCrown);
export const Database = make(faDatabase);
export const Download = make(faDownload);
export const Ellipsis = make(faEllipsis);
export const ExternalLink = make(faUpRightFromSquare);
export const Eye = make(faEye);
export const EyeOff = make(faEyeSlash);
export const FileQuestion = make(faFileCircleQuestion);
export const FileText = make(faFileLines);
export const FileUp = make(faFileArrowUp);
export const Flame = make(faFire);
export const GitBranch = make(faCodeBranch);
export const Globe = make(faGlobe);
export const GraduationCap = make(faGraduationCap);
export const GripVerticalIcon = make(faGripVertical);
export const HeadphonesIcon = make(faHeadphones);
export const Heart = make(faHeart);
export const InfoIcon = make(faCircleInfo);
export const Layout = make(faTableColumns);
export const LayoutDashboard = make(faTableColumns);
export const LayoutGrid = make(faTableCellsLarge);
export const Lightbulb = make(faLightbulb);
export const LineChart = make(faChartLine);
export const ListChecks = make(faListCheck);
export const Loader2 = make(faSpinner);
export const Loader2Icon = make(faSpinner);
export const Lock = make(faLock);
export const LogIn = make(faRightToBracket);
export const LogOut = make(faRightFromBracket);
export const Mail = make(faEnvelope);
export const Phone = make(faPhone);
export const Map = make(faMap);
export const MapPin = make(faLocationDot);
export const Maximize2 = make(faExpand);
export const Medal = make(faMedal);
export const Menu = make(faBars);
export const MessageSquare = make(faComment);
export const Minimize2 = make(faCompress);
export const MonitorPlay = make(faDesktop);
export const Moon = make(faMoon);
export const NotebookPen = make(faPenToSquare);
export const OctagonXIcon = make(faCircleXmark);
export const Paintbrush = make(faPaintbrush);
export const Palette = make(faPalette);
export const Pencil = make(faPencil);
export const Play = make(faPlay);
export const Plus = make(faPlus);
export const RefreshCw = make(faArrowsRotate);
export const Rocket = make(faRocket);
export const RotateCcw = make(faRotateLeft);
export const Save = make(faFloppyDisk);
export const Search = make(faMagnifyingGlass);
export const SearchIcon = make(faMagnifyingGlass);
export const Send = make(faPaperPlane);
export const SendHorizonal = make(faPaperPlane);
export const Settings = make(faGear);
export const Settings2 = make(faSliders);
export const Share2 = make(faShareNodes);
export const Shield = make(faShield);
export const ShieldAlert = make(faShieldHalved);
export const ShieldCheck = make(faShieldHalved);
export const Sparkles = make(faWandMagicSparkles);
export const Sprout = make(faSeedling);
export const Square = make(faSquare);
export const Star = make(faStar);
export const StickyNote = make(faNoteSticky);
export const Sun = make(faSun);
export const Tag = make(faTag);
export const Target = make(faBullseye);
export const Terminal = make(faTerminal);
export const Timer = make(faStopwatch);
export const Trash2 = make(faTrash);
export const TrendingDown = make(faArrowTrendDown);
export const TrendingUp = make(faArrowTrendUp);
export const TriangleAlertIcon = make(faTriangleExclamation);
export const Trophy = make(faTrophy);
export const UploadCloud = make(faCloudArrowUp);
export const User = make(faUser);
export const UserCheck = make(faUserCheck);
export const UserPlus = make(faUserPlus);
export const UserX = make(faUserXmark);
export const Users = make(faUsers);
export const Video = make(faVideo);
export const Wifi = make(faWifi);
export const X = make(faXmark);
export const XCircle = make(faCircleXmark);
export const XIcon = make(faXmark);
export const Zap = make(faBolt);
