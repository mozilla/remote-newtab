const TileUtils = {
  DIRECTORY_FRECENCY: 1000,
  MAX_NUM_LINKS: 100,

  /**
   * Merges the lists of all given links.
   *
   * @return {Array} The merged list.
   */
  getMergedLinks: function (allLinks) {
    return allLinks
      .reduce((newLinks, currLinks) => newLinks.concat(currLinks), [])
      .sort(this.compareLinks)
      .slice(0, this.MAX_NUM_LINKS);
  },

  /**
   * Compares two links.
   *
   * @param {Link} aLink1 The first link.
   * @param {Link} aLink2 The second link.
   * @return {Integer} -1 if aLink1 is ordered before aLink2, 0 if
   *         aLink1 and aLink2 have the same ordering, or 1 if
   *         aLink1 is ordered after aLink2.
   *
   * NOTE: compareLinks's this object is bound to Links below.
   */
  compareLinks: function (aLink1, aLink2) {
    // The properties of link objects used to sort them.
    const requiredProps = ['frecency', 'lastVisitDate', 'url'];
    if (!requiredProps.every(prop => prop in aLink1 && prop in aLink2)) {
      throw new Error('Comparable link missing required property');
    }
    const result = aLink2.frecency - aLink1.frecency ||
                 aLink2.lastVisitDate - aLink1.lastVisitDate ||
                 aLink1.url.localeCompare(aLink2.url);
    return result === 0 ? 0 : result / Math.abs(result);
  },

  formatHistoryTiles: function (sites) {
    return sites.map(site => {
      return {
        title: new URL(site.url).host.replace('www.', ''),
        type: site.type,
        url: site.url,
        lastVisitDate: site.lastVisitDate,
        frecency: site.frecency
      };
    }).filter((site, index, arr) => arr.map(s => s.title).indexOf(site.title) === index);
  },

  formatDirectoryTiles: function (sites) {
    return sites.map((site, index) => {
      // Directory tiles are prioritized in the order that is sent from the server. Since all
      // Directory tiles start with the same frecency, and lastVisitDate is the second criteria
      // for sort-order measurement, we set dummy visit dates in descending values
      site.lastVisitDate = sites.length - index;
      site.frecency = this.DIRECTORY_FRECENCY;
      return site;
    });
  }
};
module.exports = TileUtils;
