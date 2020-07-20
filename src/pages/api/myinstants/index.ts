import microCors from 'micro-cors';
import Axios from 'axios';
import cheerio from 'cheerio';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

const cors = microCors();

const CACHE_CONTROL_HEADER_VALUE =
  'max-age=0, s-maxage=43200, stale-while-revalidate, public';

const handler = nc<NextApiRequest, NextApiResponse>().get(async (req, res) => {
  res.setHeader('Cache-Control', CACHE_CONTROL_HEADER_VALUE);

  let currentPage = 1;
  let lastPage = 2;

  const soundsToSave = [];

  while (currentPage < lastPage) {
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

    console.log(currentPage);
    currentPage++;
  }

  res.json(soundsToSave);
});

export default cors(handler);
