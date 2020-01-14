# ROSI Prototype

[A customizable tool to visualize open scientometric indicators](labs.tib.eu/rosi/prototype/)

The ROSI prototype aims to visualize the impact of publications. Users can retrieve information by entering the persistent identifier of a publication (doi). Data is only retrieved from open data sources, that supply an open interface.

The tool is a work in progress. Feedback is very welcome. Contact us at [rosi.project(at)tib.eu](mailto:rosi.project(at)tib.eu) to get involved.

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

## Technical implementation

The tool bases on existing javascript libraries for some of the core functionalities:

* [jQuery](https://jquery.com/) - basic javascript library
* [alpacajs](http://alpacajs.org) - js form generator library
* [paperbuzzviz](https://github.com/jalperin/paperbuzzviz) - js library to vizualize PaperBuzz metrics
* [chartjs](https://www.chartjs.org/) - js library to vizualize charts

Data sources are accessed via APIs and data is retrieved in json format. All internal data is also stored in json format.
The [lists of all available indicators](https://labs.tib.eu/rosi/prototype/indicators/) and [all customizations](https://labs.tib.eu/rosi/prototype/customize/) are being managed reusing a previously implemented [registry application](github.com/lilients/registry).

Current and future developments can be traced in the [ROSI prototype project](https://github.com/TIBHannover/rosi-prototype/projects/1)

## Contact

ROSI - Project at Open Science Lab of TIB
[tib.eu/rosi-project](tib.eu/rosi-project)
[rosi.project(at)tib.eu](mailto:rosi.project(at)tib.eu)

## Installation

1. clone this repo (with submodules)
2. run npm install

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT)
