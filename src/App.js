import React, {Component} from 'react';
import PropTypes from 'prop-types'
import Files from 'react-files'
import {parseString} from 'xml2js';
import FileDownload from "js-file-download";
import fileSize from "filesize";
import Dygraph from 'dygraphs/index.es5';
import {
  Container,
  Row,
  Col,
  Input,
  Table,
  Navbar,
  NavbarBrand,
  Badge,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label
} from 'reactstrap';
import './App.css';

// Utils
let zip = (iter) => iter[0].map((_, c) => iter.map(i => i[c]));
let arrayToCSV = (arr) => arr.map(
  (line) => line.join(",")
).join("\n");
let unitFormat = (arr) => {
  return arr[1] === "" ? arr[0] : `${arr[0]} (${arr[1]})`
};


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fileJSON: null,
      fileSize: null,
      selectedDataSet: 0
    };

    this.onFilesChange = this.onFilesChange.bind(this);
    this.onDataSetSelect = this.onDataSetSelect.bind(this);
  }

  onDataSetSelect(e) {
    this.setState({
      selectedDataSet: parseInt(e.target.value, 10)
    })
  }

  onFilesChange(files) {
    // Is called when a file is loaded
    let file = files[0];
    let reader = new FileReader();
    reader.onloadend = () => {
      parseString(
        reader.result,
        (err, result) => this.setState({
          fileJSON: result["Document"],
          fileSize: file.size,
          selectedDataSet: 0
        })
      );
    };
    reader.readAsText(file);
  }

  static onFilesError(error) {
    alert('Error code ' + error.code + ': ' + error.message)
  }


  render() {
    let fileLoaded = this.state.fileJSON !== null;
    let dataSetShapes;
    let dataSetsHeaders = [];
    let dataSets = [];
    let fileName;
    if (this.state.fileJSON !== null) {
      // Loop the DataSets to store data as 2d array and remove empty columns
      // Because for some reason some of the DataColumns don't have data inside ...
      this.state.fileJSON["DataSet"].forEach(
        (i) => {
          if ("DataColumn" in i) {
            // TODO figure out why some data sets don't have data (!?)
            dataSets.push([]);
            dataSetsHeaders.push([]);
            i["DataColumn"].forEach(
                (j) => {
                  if ("ColumnCells" in j) {
                    dataSets[dataSets.length - 1].push(
                        j["ColumnCells"][0].trim().split("\n").map(
                            (k) => parseFloat(k)
                        )
                    );
                    dataSetsHeaders[dataSets.length - 1].push(
                        [j["DataObjectName"][0], j["ColumnUnits"][0]]
                    )
                  }
                }
            );
          }
        }
      );
      dataSetShapes = dataSets.map((i) => [i.length, i[0].length]);
      fileName = this.state.fileJSON["FileName"][0];
    }
    return (
      <div className="App">
        <Navbar color="dark" dark expand="md">
          <NavbarBrand href="#" className={"mx-auto"}>Online LoggerPro</NavbarBrand>
        </Navbar>

        <Container>
          <Row>
            <Col className={"vertical-align"}>
              <Files className='files-dropzone'
                     onChange={this.onFilesChange}
                     onError={App.onFilesError}
                // TODO find out the other file formats
                     accepts={['.cmbl', '.qmbl']}
                     multiple={false}
                     maxFileSize={10000000}
                     minFileSize={0}
                     clickable={true}>
                Drop files here or click to upload
              </Files>
            </Col>
            <Col>
              {fileLoaded
                ? <FileInfo fileName={fileName}
                            fileSize={this.state.fileSize}
                            dataSetShapes={dataSetShapes}/>
                : <div className="info-text">No file loaded</div>}
            </Col>
            <Col className="vertical-align">
              {fileLoaded
                ? <Export dataSet={zip(dataSets[this.state.selectedDataSet])}
                          dataSetHeaders={dataSetsHeaders[this.state.selectedDataSet]}
                          fileName={
                            `${fileName.split(".")[0]}_data_set_${this.state.selectedDataSet + 1}.csv`
                          }/>
                : null}
            </Col>
          </Row>
          <Row>
            <Col>
              {fileLoaded
                ? <DataSetSelector selectedDataSet={this.state.selectedDataSet}
                                   dataSetChangeCallback={this.onDataSetSelect}
                                   dataSets={dataSets}
                                   dataSetsHeaders={dataSetsHeaders}/>
                : null}
            </Col>
          </Row>
        </Container>
      </div>
    );
  }
}


class FileInfo extends Component {
  render() {
    let shapes = this.props.dataSetShapes.map(
      (i, index) => <Badge color="secondary" key={index} className="data-set-shape">{i[0]} x {i[1]}</Badge>
    );
    let numberDataSets = this.props.dataSetShapes.length;
    return (
      <div id="file-info">
        <div>File name: {this.props.fileName}</div>
        <div>File size: {fileSize(this.props.fileSize)}</div>
        <div>{numberDataSets} data set{numberDataSets > 1 ? "s" : ""}: {shapes}</div>
      </div>
    );
  }
}

FileInfo.propTypes = {
  fileName: PropTypes.string,
  fileSize: PropTypes.number,
  dataSetShapes: PropTypes.array // [[1, 2], [10, 5]]
};


class Export extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modal: false,
      unitsChecked: false,
      fileName: this.props.fileName
    };
    this.toggleModal = this.toggleModal.bind(this);
    this.exportDataSet = this.exportDataSet.bind(this);
  }

  exportDataSet() {
    this.toggleModal();
    let csv = [
      this.props.dataSetHeaders.map(
          (i) => this.state.unitsChecked ? unitFormat(i) : i[0]
      ),
      ...this.props.dataSet
    ];
    FileDownload(arrayToCSV(csv), this.state.fileName)
  }

  toggleModal() {
    this.setState({
      modal: !this.state.modal
    });
  }

  render() {
    return (
      <div>
        <Button onClick={this.toggleModal}>
          Export selected data set as CSV
        </Button>
        <Modal isOpen={this.state.modal} toggle={this.toggleModal}
               className={this.props.className}>
          <ModalHeader toggle={this.toggleModal}>Export to CSV</ModalHeader>
          <ModalBody>
            <Form>
              <FormGroup>
                <Label>Filename</Label>
                <Input type="text" value={this.state.fileName}
                       onChange={(e) => this.setState({fileName: e.target.value})}/>
              </FormGroup>
              <FormGroup check>
                <Label check>
                  <Input type="checkbox"
                         checked={this.state.unitsChecked}
                         onChange={(e) =>
                      this.setState({unitsChecked: e.target.checked})}/>{' '}
                  Column headers include units
                </Label>
              </FormGroup>
            </Form>
          </ModalBody>
          <ModalFooter>
          <Button color="secondary" onClick={this.toggleModal}>Cancel</Button>
          <Button color="primary" onClick={this.exportDataSet}>Download</Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

Export.propTypes = {
  fileName: PropTypes.string,
  dataSetHeaders: PropTypes.array,
  dataSet: PropTypes.array
};


class DataSetSelector extends Component {
  render() {
    let i = this.props.selectedDataSet;
    return (
      <Container fluid={true}><Row>
        <Col md={4}>
          <Input type="select" name="select"
                 id="data-set-selector" onChange={this.props.dataSetChangeCallback}>
            {this.props.dataSets.map(
              (dataSet, ind) =>
                <option key={ind} value={ind}>Data Set {ind + 1}</option>
            )}
          </Input>

          <DataTable dataSetHeaders={this.props.dataSetsHeaders[i]}
                     dataSet={this.props.dataSets[i]}/>
        </Col>
        <Col md={8}>
          <DataGraph axisLabels={this.props.dataSetsHeaders[i]}
                     columns={this.props.dataSets[i]}/>
        </Col>
      </Row></Container>
    );
  }
}

DataSetSelector.propTypes = {
  selectedDataSet: PropTypes.number,
  dataSetChangeCallback: PropTypes.func,
  dataSets: PropTypes.array,
  dataSetsHeaders: PropTypes.array
};


class DataTable extends Component {
  render() {
    let rows = zip(this.props.dataSet);
    return <div className="data-table-wrapper">
      <Table className="data-table" bordered={true} hover={true}>
        <thead>
        <tr>
          {this.props.dataSetHeaders.map(
            (header, i) => <th key={i}>{unitFormat(header)}</th>
          )}
        </tr>
        </thead>
        <tbody>
        {rows.map(
          (row, i) => <tr key={i}>{
            row.map(
              (number, j) =>
                <td key={i.toString() + j.toString()}>{number.toFixed(2)}</td>
            )
          }</tr>
        )}
        </tbody>
      </Table>
    </div>
  }
}

DataTable.propTypes = {
  dataSetHeaders: PropTypes.array,
  dataSet: PropTypes.array
};


class DataGraph extends Component {
  constructor(props) {
    super(props);
    this.state = {
      pointGraph: false,
      modal: false
    };
    this.axisLabels = this.props.axisLabels.map(unitFormat);
    this.g = null;
    this.reset = this.reset.bind(this);
    this.togglePointGraph = this.togglePointGraph.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
  }

  generateData() {
    return zip(
      this.props.columns
    ) //.map((i) => i.join(","));
  }

  togglePointGraph() {
    this.setState({
      pointGraph: !this.state.pointGraph
    })
  }

  toggleModal() {
    this.setState({
      modal: !this.state.modal
    });
  }

  generateOptions() {
    let labels = this.props.axisLabels.map((_, ind) => ind === 0 ? "X" : "Y" + ind);
    let seriesOptions = {};
    let topOptions = {
      labels: labels,
      xlabel: this.axisLabels[0],
      ylabel: this.axisLabels[1],
      // Reset the zoom
      dateWindow: null,
      valueRange: null
    };

    if (this.props.axisLabels.length > 2) {
      seriesOptions = {
        ...seriesOptions, 'Y2': {
          axis: 'y2',
        }
      };
      topOptions = {...topOptions, y2label: this.props.axisLabels[2]};
    }

    if (this.state.pointGraph) {
      topOptions = {
        ...topOptions,
        drawPoints: true,
        pointSize: 2,
        strokeWidth: 0.0
      }
    } else {
      topOptions = {
        ...topOptions,
        drawPoints: false,
        strokeWidth: 1
      }
    }

    return {...topOptions, ...{series: seriesOptions}}
  }

  componentDidMount() {
    this.g = new Dygraph(
      this.refs.graph, this.generateData().join("\n"), this.generateOptions()
    );
  }

  reset = () => this.g.updateOptions(Object.assign(
    {'file': this.generateData()}, this.generateOptions()
  ));

  render() {
    if (this.g !== null) {
      // If the digraph object has been created, we refresh the current graph
      // Else a new graph is created in componentDidMount
      this.reset()
    }

    return <div id="graph-wrapper" className="text-center">
      <div id="graph" ref="graph">Graph loading ...</div>
      <div className="buttons">
        <Button onClick={this.togglePointGraph}>
          {this.state.pointGraph
            ? "Link data points"
            : "Unlink data points"}
        </Button>
        <Button outline onClick={this.toggleModal}>Graph controls</Button>
        {/* Graph controls modals */}
        <Modal isOpen={this.state.modal} toggle={this.toggleModal} className={this.props.className}>
          <ModalHeader toggle={this.toggleModal}>Graph controls</ModalHeader>
          <ModalBody>
            <ul>
              <li>Drag to zoom</li>
              <li>Shift + drag to pan</li>
              <li>Double click to reset zoom and pan</li>
            </ul>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.toggleModal}>OK</Button>
          </ModalFooter>
        </Modal>
      </div>
    </div>
  }
}

DataGraph.propTypes = {
  columns: PropTypes.array,
  axisLabels: PropTypes.array,
};

export default App;
