# ImpactViz 

[![Project Status: WIP – Initial development is in progress, but there has not yet been a stable, usable release suitable for the public.](https://www.repostatus.org/badges/latest/wip.svg)](https://www.repostatus.org/#wip)

ImpactViz - Open Impact Vizualiser enables the display of open metrics on article pages

Open scientometric indicators enable a comprehensible evaluation of science. The tool "ImpactViz - Open Impact Vizualizer" ([Github](https://github.com/tibhannover/rosi-prototype)), developed in the project [ROSI (Reference Implementation for Open Scientometric Indicators)](https://tib.eu/rosi-project), enables the adaptable presentation of open scientometric information from scientific publications.

ImpactViz aims to visualize the impact of publications. Users can retrieve information by entering the persistent identifier of a publication (doi). Data is only retrieved from open data sources, that supply an open interface.

[Demo](labs.tib.eu/rosi/prototype/)

## Features

### Visualization
* recognition of articles with persisten identifier (doi)
* display overview of the impact in the four areas (concepts): scientific impact, societal impact, community, openness
* display all indicators in detailed view at single tabs (for each concept) 
* display timelines based on data from PaperBuzz (using [paperbuzzviz](https://github.com/jalperin/paperbuzzviz))
* display list of available indicators

### Configuration: Adding new indicators
* addition of new indicators (password protected)

### Customization: Select displayed indiators
* selection between existing customization in a dropdown
* addition of new customizations: selection of the indicators, that will be displayed 

## Options
ImpactViz has the follwing settings that can be passed via JavaScript (see example below):
* customizeFile - string
* indicatorsFile - string
* entitiesPath - string
* imgPath - string
* title - boolean

## Technical implementation

The tool bases on existing JavaScript libraries for some of the core functionalities:

* [jQuery](https://jquery.com/) - basic javascript library
* [alpacajs](http://alpacajs.org) - js form generator library
* [paperbuzzviz](https://github.com/jalperin/paperbuzzviz) - js library to vizualize PaperBuzz metrics
* [chartjs](https://www.chartjs.org/) - js library to vizualize charts

Data sources are accessed via APIs and data is retrieved in json format. All internal data is also stored in json format.
The [lists of all available indicators](https://labs.tib.eu/rosi/prototype/indicators/) and [all customizations](https://labs.tib.eu/rosi/prototype/customize/) are being managed reusing a previously implemented [registry application](github.com/lilients/registry).

Current and future developments can be traced in the [ROSI prototype project](https://github.com/TIBHannover/rosi-prototype/projects/1)

## Contact

Contact us at [rosi.project(at)tib.eu](mailto:rosi.project(at)tib.eu) to get involved.

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT)

## Installation Standalone

1. clone this repo (with submodules)
2. run npm install

## Include ImpactViz in your own tool

You can easily include ImpactViz in your own tool. You need to 
* add the needed libraries to your header
* add a div the the html structure of your page 
```
  <!-- overview -->
  <div id="impactviz-overview"></div>
  <!-- details -->
  <div id="impactviz-details"></div>
 ```
* activate the script in JavaScript:
```
    <script type="text/javascript">
      var identifier = "10.1038/520429a"; // get the identifier somewhere
      impact = new ImpactViz(identifier);
      impact.initViz();
    </script>
```
See also [example.html](https://github.com/TIBHannover/impactViz/blob/master/example.html).

## Available Plugins

* OJS (work in progress)
* VIVO (work in progress)
