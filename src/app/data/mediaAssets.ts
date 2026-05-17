import akadClose from "../../../asset/web/akad-close.jpg";
import ceremonyTable from "../../../asset/web/ceremony-table.jpg";
import couplePortrait from "../../../asset/web/couple-portrait.jpg";
import detailPortrait from "../../../asset/web/detail-portrait.jpg";
import familyStage from "../../../asset/web/family-stage.jpg";
import groupStage from "../../../asset/web/group-stage.jpg";
import heroAkad from "../../../asset/web/hero-akad.jpg";
import heroMoment from "../../../asset/web/hero-moment.jpg";
import heroRing from "../../../asset/web/hero-ring.jpg";
import imageOne from "../../../asset/image_1.jpg";
import outdoorCouple from "../../../asset/web/outdoor-couple.jpg";
import ringPortrait from "../../../asset/web/ring-portrait.jpg";

export const mediaAssets = {
  hero: {
    akad: heroAkad,
    ring: heroRing,
    moment: heroMoment,
  },
  wedding: {
    ceremony: akadClose,
    table: ceremonyTable,
    couplePortrait,
    group: groupStage,
    family: familyStage,
    ringPortrait,
    ringWide: heroRing,
    detailPortrait,
  },
  editorial: {
    outdoorCouple,
  },
  ui: {
    ctaBackground: imageOne,
    promo: couplePortrait,
    login: outdoorCouple,
    menu: heroRing,
  },
} as const;
