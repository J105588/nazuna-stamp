export const isInAppBrowser = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return (ua.indexOf("FBAN") > -1) ||
         (ua.indexOf("FBAV") > -1) ||
         (ua.indexOf("Instagram") > -1) ||
         (ua.indexOf("Line") > -1) ||
         (ua.indexOf("Twitter") > -1) ||
         (ua.indexOf("Hatena") > -1);
};
