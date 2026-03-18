
import defaultSettings from '@/settings';

const title = window.localStorage.getItem('platSiteName') || '';

export default function getPageTitle(pageTitle) {
  if (pageTitle) {
    return `${pageTitle} - ${title}`;
  }
  return `${title}`;
}
