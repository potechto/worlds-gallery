/* Worlds Gallery curated editorial discovery set. No user-uploaded or private media.
   Each Commons file has its own attribution/link and license below; see LICENSES_AND_SOURCES.md.
*/
(() => {
  'use strict';
  const commonsFile = file => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file).replace(/%20/g,'_')}`;
  const commonsPreview = file => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file).replace(/%20/g,'_')}?width=1000`;
  const media = (file, author, license) => Object.freeze({file, author, license, url:commonsFile(file), image:commonsPreview(file)});
  const destinations = Object.freeze([
    {id:'reine', name:'Reine, Lofoten', country:'Norway', iso:'NO', region:'Nordland',
      description:'A quiet fishing village surrounded by steep peaks and northern seas.',
      discovery:'Reine is a village on the island of Moskenesøya in the Lofoten archipelago.',
      media:media('Reine - Lofoten.jpg','Jakub Fryš','CC BY-SA 4.0')},
    {id:'skogafoss', name:'Skógafoss', country:'Iceland', iso:'IS', region:'South Iceland',
      description:'A roaring waterfall for the days you want to feel the scale of nature.',
      discovery:'Skógafoss is a waterfall along the Skógá River in southern Iceland.',
      media:media('Iceland skogafoss waterfall.jpg','Delahanty','CC BY 4.0')},
    {id:'kyoto', name:'Kiyomizu-dera, Kyoto', country:'Japan', iso:'JP', region:'Kyoto',
      description:'A temple landscape where living traditions meet a view of the city.',
      discovery:'Kiyomizu-dera is among the Historic Monuments of Ancient Kyoto inscribed by UNESCO.',
      media:media('JAP Kyoto Kiyomizu-dera.jpg','Grueslayer','CC BY-SA 4.0')},
    {id:'escolta', name:'Escolta Street', country:'Philippines', iso:'PH', region:'Manila',
      description:'Walk through the commercial heart of old Manila and notice what survived.',
      discovery:'Escolta was one of Manila’s historic shopping and business streets.',
      media:media('Escolta Street (Binondo, Manila; 11-10-2019).jpg','Patrickroque01','CC BY-SA 4.0')},
    {id:'ginza', name:'Ginza', country:'Japan', iso:'JP', region:'Tokyo',
      description:'Discover the layered architecture and street life of a changing city.',
      discovery:'Ginza is a well-known commercial district of Chūō, Tokyo.',
      media:media('Ginza 4-Chome Crossing 2020-04-19.jpg','Asanagi','CC0 1.0')},
    {id:'tower', name:'Tower Bridge', country:'United Kingdom', iso:'GB', region:'London',
      description:'A landmark where engineering, river life, and the city meet.',
      discovery:'Tower Bridge opened in 1894 and has movable bascules to let tall vessels pass.',
      media:media('Tower Bridge in London.jpg','Boaventuravinicius','CC BY-SA 3.0')},
    {id:'banaue', name:'Banaue Rice Terraces', country:'Philippines', iso:'PH', region:'Ifugao',
      description:'Terraced mountain landscapes shaped by farming knowledge across generations.',
      discovery:'Ifugao communities maintain rice-terrace farming traditions in the Cordillera.',
      media:media('Banaue RiceTerraces.jpg','Jose B. Cabajar','CC BY-SA 3.0')},
    {id:'pinatubo', name:'Mount Pinatubo Crater Lake', country:'Philippines', iso:'PH', region:'Central Luzon',
      description:'An unexpectedly serene lake within a dramatic volcanic landscape.',
      discovery:'Mount Pinatubo’s 1991 eruption reshaped the volcano and surrounding landscape.',
      media:media('The Crater Lake of Mt. Pinatubo.jpg','Lemuel Salibio','CC BY-SA 4.0')}
  ]);
  const moods = Object.freeze([
    {id:'peaceful',label:'Peaceful',icon:'☁',places:['reine','banaue']},
    {id:'adventurous',label:'Adventurous',icon:'△',places:['skogafoss','pinatubo']},
    {id:'nostalgic',label:'Nostalgic',icon:'◷',places:['escolta','kyoto']},
    {id:'curious',label:'Curious',icon:'✦',places:['ginza','escolta']},
    {id:'romantic',label:'Romantic',icon:'♡',places:['kyoto','reine']},
    {id:'inspired',label:'Inspired',icon:'✳',places:['tower','banaue']}
  ]);
  window.WorldsGalleryDiscoveryData = Object.freeze({destinations,moods});
})();
