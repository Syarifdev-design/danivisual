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
import statsBackgroundVideo from "../../../asset/35575-407595493.webm";
import ctaBackgroundVideo from "../../../asset/152798-803733100.webm";
import outdoorCouple from "../../../asset/web/outdoor-couple.jpg";
import openingHeroVideo from "../../../asset/128905-742901848.webm";
import ringPortrait from "../../../asset/web/ring-portrait.jpg";
import bannerHomeImage1 from "../../../asset/banner_home/image_1.jpg";
import bannerHomeImage2 from "../../../asset/banner_home/image_2.jpg";
import bannerHomeImage3 from "../../../asset/banner_home/image_3.jpg";
import bannerHomeImage4 from "../../../asset/banner_home/image_4.jpg";
import bannerHomeImage5 from "../../../asset/banner_home/image_5.jpg";
import bannerHomeImage6 from "../../../asset/banner_home/image_6.jpg";
import bannerHomeImage7 from "../../../asset/banner_home/image_7.jpg";
import bannerHomeImage8 from "../../../asset/banner_home/image_8.jpg";

export const mediaAssets = {
  hero: {
    openingVideo: openingHeroVideo,
    akad: heroAkad,
    ring: heroRing,
    moment: heroMoment,
    bannerHome: [
      bannerHomeImage1,
      bannerHomeImage2,
      bannerHomeImage3,
      bannerHomeImage4,
      bannerHomeImage5,
      bannerHomeImage6,
      bannerHomeImage7,
      bannerHomeImage8,
    ],
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
    ctaBackgroundVideo,
    login: outdoorCouple,
    menu: heroRing,
    statsBackground: statsBackgroundVideo,
  },
} as const;
