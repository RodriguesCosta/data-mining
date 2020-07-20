import Axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const handler = nc<NextApiRequest, NextApiResponse>().get(async (req, res) => {
  const cacheExist = fs.existsSync('./local-data/myinstants.json');

  if (cacheExist) {
    const jsonToReturn = fs.readFileSync('./local-data/myinstants.json');
    return res.json(jsonToReturn);
  }

  let currentPage = 1;
  let lastPage = 2;

  const soundsToSave = [];

  while (currentPage <= lastPage) {
    console.log(`Load page ${currentPage}`);

    const { data } = await Axios.get(
      `https://www.myinstants.com/index/br/?page=${currentPage}`
    );

    const $ = cheerio.load(data);

    if (currentPage === 1) {
      const lastPageHtml = $('#results-pagination')
        .find('.hide-on-small-only')
        .last()
        .find('a')
        .html();

      lastPage = Number(lastPageHtml);
    }

    $('#instants_container')
      .find('.instant')
      .map((i, el) => {
        const soundPath = $(el)
          .find('.small-button')
          .attr('onmousedown')
          .replace("play('", '')
          .replace("')", '');
        const soundName = $(el).find('.instant-link').html();

        soundsToSave.push({
          name: soundName,
          link: `https://www.myinstants.com${soundPath}`,
        });
      });

    currentPage++;
  }

  fs.writeFileSync(
    './local-data/myinstants.json',
    JSON.stringify(soundsToSave)
  );

  res.json(soundsToSave);
});

export default handler;
