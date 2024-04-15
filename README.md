# README #

A stripped down fork of https://github.com/montulli/GrooveScribe to embed drum
sheet notation in [Notion](https://www.notion.so/).

First, read
[GrooveScribe README](https://github.com/montulli/GrooveScribe?tab=readme-ov-file#).

Changes:

1. Make `GrooveEmbed.html` the default `index.html`.

2. Remove included javascript related to MIDI, sounds, sharing, etc. You can
still click on the notation to be linked to the full GrooveScribe page where
you can edit the notation and play it.

3. Add a HTML query string to display tempo and time signature with the
notation. To use this, add `&EmbedTempoTimeSig=true` to the end of the URL.

4. An utility to convert a `https://www.mikeslessons.com/groove` link to an
embeddable link.
