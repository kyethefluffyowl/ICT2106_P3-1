import React from "react";
import { ActionsButton, DivSpacing, IconButton, IconButtonWithText, MultiStepBox, SearchBar, SearchTags, SizedBox, StdButton, TagsBox } from "../Components/common";
import {AccessDeniedPanel, Loading} from "../Components/appCommon";
import { StdInput } from "../Components/input";
import SlideDrawer, { DrawerItemNonLink } from "../Components/sideNav";
import { Cell, ListTable, HeaderRow, ExpandableRow } from "../Components/tableComponents";
import {CSVLink} from "react-csv";
import U from "../Utilities/utilities";

export const searchSuggestions = [
]

const CurrentTags = [
]

const settings = {
}

export default class DatapageLayout extends React.Component {
    state = {
        drawerOpen: false,
        expanded: false,
        showBottomMenu: false,
        expansionContent: "",
        expansionComponent: "",
        popUpContent: "",
        data: this.props.data,
        itemsPerPage: 20,
        currentPage: 1,
        pageNumbers: [],
    }
    constructor(props) {
        super(props)

        this.drawerToggleClickHandler = this.drawerToggleClickHandler.bind(this);
        this.setExpansionContent = this.setExpansionContent.bind(this);
        this.handleSeeMore = this.handleSeeMore.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.expand = this.expand.bind(this);
    }
    componentDidMount = async () =>{
        document.title = this.props.settings.title;
        window.addEventListener("resize", this.resize.bind(this));
        this.resize();
        const perms = await this.props.permissions.find(p => p.Module === this.props.settings.title);
        const reformattedPerms = [];
        Object.keys(perms).forEach((perm)=>{
            return perm === "Module" ? null : 
                perms[perm] === true ? reformattedPerms.push(perm) : null
        });
        const pageNumbers = [];
        for (let i = 1; i <= Math.ceil(this.state.data.length / this.state.itemsPerPage); i++) {
            pageNumbers.push(i);
        }
        let extraComponents = [];
        this.props.extraComponents?.length > 0 && 

            this.props.extraComponents.forEach((component)=>{
                
                U.checkSubset(component.requiredPerms,reformattedPerms) && 
                    extraComponents.push(component)
            })
        let tableHeaderActions = await this.populateActions(perms,extraComponents);
        this.setState({
            extraComponents: extraComponents,
            tableHeaderActions: tableHeaderActions,
            data: this.props.data,
            perms : perms,
            pageNumbers: pageNumbers,
        })
    }

    populateActions = async (perms,components)=>{
        let tableHeaderActions = [];
        if (perms?.Create) {
            tableHeaderActions.push({ label: "Add " + this.props.settings.title, onClick: () => { this.setExpansionContent("add") } })
        }
        if (perms?.Delete) {
            tableHeaderActions.push({ label: "Delete " + this.props.settings.title, onClick: () => { this.setExpansionContent("del") } })
        }
        tableHeaderActions.push({ label: "Generate Spreadsheet", onClick: () => { this.setExpansionContent("gs") } },)
        
        components.forEach((component)=>{
            tableHeaderActions.push({label: component.label, onClick: ()=>{this.setExpansionContent(component.key)}})
        })
        return tableHeaderActions;
    }

    rerenderPageNums = (e) => {
        const pageNumbers = [];
        for (let i = 1; i <= Math.ceil(this.state.data.length / e); i++) {
            pageNumbers.push(i);
        }

        this.setState({
            pageNumbers: pageNumbers
        })
    }

    pageNumberClick = (number) => {

        if (number < 1 || number > this.state.pageNumbers.length) {
            return;
        }

        this.setState({
            currentPage: number
        })
    }

    expand() {
        if(this.state.expanded){
            this.setState({
                expanded: !this.state.expanded,
                expansionContent:"",
            })
        }else{
            this.setState({
                expanded: !this.state.expanded,
            })

        }
    }

    setExpansionContent = content => {
        if (this.state.expanded && this.state.expansionContent === content) {
            this.setState({
                expansionContent: "",
                expanded: false,
            })
        } else {

            this.setState({
                expansionContent: content,
                expanded: true,
            })
        }
    }
    drawerToggleClickHandler() {
        this.setState({
            drawerOpen: !this.state.drawerOpen
        })
    }

    resize() {
        if (window.innerWidth <= 760) {
            this.setState({
                showBottomMenu: true
            })
        } else {
            this.setState({
                showBottomMenu: false
            })
        }
    }

    handleSeeMore(content) {
        this.setState({
            popUpContent: content
        })
    }

    handleSearchCallBack =(tags) =>{
        
        if(tags.length === 0){
            return this.setState({
                data: this.props.data
            })
        }
        let filteredData = [];
        this.props.data.forEach((item)=>{
            Object.keys(item).forEach((key)=>{
                tags.forEach((tag) => {
                    let tagvalue = tag.value.substring(1,tag.value.length -1);
                    let found = String(item[key]).toLowerCase().includes(tagvalue.toLowerCase());
                    if(found){
                        if(filteredData.find((filteredItem)=>filteredItem === item)){
                            return;
                        }else{
                            filteredData.push(item);
                        }
                    }
                })
            })
        })
        this.setState({
            data: filteredData
        })
    }

    handleClose() {
        this.setState({
            popUpContent: ""
        })
    }

    render() {
        if(this.state.content === ""){
            return <div></div>
        }
        const indexOfLastItem = this.state.currentPage * this.state.itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - this.state.itemsPerPage;
        const currentItems = this.state.data.slice(indexOfFirstItem, indexOfLastItem);

        return (
            this.state.perms?.Read ? 
            <div className="d-flex flex-column container-fluid listPageContainer h-100">
                {this.props.error !== "" && 
                    <div className="listPageContainer-error">
                        {this.props.error}
                        <IconButton 
                            icon = {<i className="bi bi-x-circle-fill"></i>} 
                            onClick = {()=>this.props.requestError("")}
                        ></IconButton>
                    </div>
                }
                <div className="col-12 d-flex flex-column h-100">
                    
                    <TableHeader actions={
                        this.state.tableHeaderActions
                    } 
                    requestRefresh={this.props.requestRefresh} 
                    fieldSettings={this.props.fieldSettings} 
                    settings={this.props.settings} 
                    showBottomMenu={this.state.showBottomMenu} 
                    handles={this.setExpansionContent} 
                    persist={this.state.showBottomMenu} 
                    expanded={this.state.expanded} 
                    component={this.state.expansionContent} 
                    handleClose={this.expand}
                    handleSearchCallBack = {this.handleSearchCallBack}
                    tagUpdate = {this.handleSearchCallBack}
                    data={this.state.data}
                    perms={this.state.perms}
                    requestError={this.props.requestError}
                    extraComponents={this.state.extraComponents}
                    ></TableHeader>
                    <TableFooter settings={this.props.settings} toggle={this.drawerToggleClickHandler} showBottomMenu={this.state.showBottomMenu}></TableFooter>
                    <DivSpacing spacing={1}></DivSpacing>
                    <div className="d-flex justify-content-center align-items-start flex-fill">
                        <ListTable settings={this.settings}>
                            <HeaderRow>
                                {Object.keys(this.props.headers).map((key, index) => {
                                    return <Cell width={"100%"} key={index}>{this.props.headers[key].displayHeader}</Cell>
                                })}
                            </HeaderRow>
                            {this.state.data && 
                            
                            currentItems.map((row, index) => {      
                                return <ExpandableRow 
                                updateHandle={this.props.updateHandle} 
                                values={row} 
                                fieldSettings={this.props.fieldSettings} 
                                key={index} 
                                settings={settings} 
                                headers={this.props.headers} 
                                setExpansionContent={this.setExpansionContent} 
                                handleSeeMore={this.handleSeeMore} 
                                handleClose={this.handleClose} 
                                popUpContent={this.state.popUpContent}
                                perms={this.state.perms}>
                                    {this.props.children? 
                                    this.props.children[index + ((this.state.currentPage - 1) * this.state.itemsPerPage)]: 
                                    ""}
                                </ExpandableRow>
                            })}
                        </ListTable>
                        
                    </div>
                    <div className="d-flex justify-content-end page-nums-container align-self-end">
                        <div className="items-per-page">
                            <StdInput
                                type="dropdown"
                                label="hidden"
                                value={this.state.itemsPerPage}
                                onChange={(label,e) => 
                                    {
                                        this.setState({ itemsPerPage: parseInt(e) })
                                        this.rerenderPageNums( parseInt(e));
                                    }}
                                options={[
                                    {value: 5,label: "5 Per Page"},
                                    {value: 10,label: "10 Per Page"},
                                    {value: 15,label: "15 Per Page"},
                                    {value: 20,label: "20 Per Page"},
                                    {value: 25,label: "25 Per Page"},
                                    {value: 30,label: "30 Per Page"},
                                    {value: 35,label: "35 Per Page"},
                                    {value: 40,label: "40 Per Page"},
                                ]}
                                enabled={true}
                            >
                            </StdInput>
                        </div>
                        
                        <ul className="page-nums">
                            <li className={"page-direction prev " + (this.state.currentPage === 1 ? "disabled" : "")}>
                                <a href="#" onClick={() => this.pageNumberClick(this.state.currentPage - 1)}><i className="bi bi-chevron-left"></i></a>
                            </li>
                            {this.state.pageNumbers > 5 ? 
                                this.state.pageNumbers.map((number, index) => {
                                    if(this.state.currentPage > 3){
                                        if(number > this.state.currentPage - 3 && number < this.state.currentPage + 3){
                                            return (
                                                <li key={number} className={"page-num " + (this.state.currentPage === number ? "active" : "")}>
                                                    <a href="#" onClick={() => this.pageNumberClick(number)}>{number}</a>
                                                </li>
                                            )
                                        }
                                    }else{
                                        if(number < 7){
                                            return (
                                                <li key={number} className={"page-num " + (this.state.currentPage === number ? "active" : "")}>
                                                    <a href="#" onClick={() => this.pageNumberClick(number)}>{number}</a>
                                                </li>
                                            )
                                        }
                                    }
                                })
                            :
                                this.state.pageNumbers.map((number, index) => {
                                    return (
                                        <li key={number} className={"page-num " + (this.state.currentPage === number ? "active" : "")}>
                                            <a href="#" onClick={() => this.pageNumberClick(number)}>{number}</a>
                                        </li>
                                    )
                                })
                            }
                            <li className={"page-direction next " + (this.state.currentPage === this.state.pageNumbers.length ? "disabled" : "")}>
                                <a href="#" onClick={() => this.pageNumberClick(this.state.currentPage + 1)}><i className="bi bi-chevron-right"></i></a>
                            </li>
                        </ul>
                    </div>
                </div>
                <BottomMenu actions={
                        this.state.tableHeaderActions
                } settings={this.settings} show={this.state.drawerOpen} showBottomMenu={this.state.showBottomMenu} handles={this.setExpansionContent}></BottomMenu>
            </div>
            :
            <AccessDeniedPanel>
            </AccessDeniedPanel>
        )
    }
}
export class TableHeader extends React.Component {
    constructor(props) {
        super(props);
        this.toggleSearchBar = this.toggleSearchBar.bind(this);
        this.searchCallBack = this.searchCallBack.bind(this);
        this.onCancelClick = this.onCancelClick.bind(this);
        this.deleteAllTags = this.deleteAllTags.bind(this);
        this.state = {
            classList: "tableRow",
            searchBarExtended: false,
            currentTags: CurrentTags

        }
    }


    onCancelClick = (tagToRemove) =>{
        let newTags = this.state.currentTags.filter((tag)=>{
            return tag !== tagToRemove;
        })
        this.setState({
            currentTags: newTags,
        })
        this.props.tagUpdate(newTags);
    }

    componentDidUpdate(prevProps) {
        if (this.props.persist !== prevProps.persist) {
            this.setState({
                searchBarExtended: true,
            })
        }
    }

    deleteAllTags = () => {
        this.setState({
            currentTags: [],
        })
        this.props.tagUpdate([]);
    }

    toggleSearchBar() {
        this.setState({
            searchBarExtended: !this.state.searchBarExtended,
        })
    }

    searchCallBack(tag) {
        console.log(tag);
        var curTags = this.state.currentTags;
        curTags.push(tag);
        this.setState({
            currentTags: curTags,
        })

        this.props.handleSearchCallBack(this.state.currentTags);
    }

    render() {


        return (
            <div className="tableHeader">
                <div className={"tableHeaderActions " + (this.props.component === "" ? "borderRadius" : "topBorderRadius")}>
                    <div className="d-flex justify-content-end align-items-center">
                        {this.props.showBottomMenu ? <div /> :
                            <div className="tableTitleContainer">
                                <div className="tableTitlePulseAnimation-1" style={this.state.searchBarExtended ? { "--ScaleMultiplier": .75 } : { "--ScaleMultiplier": 2 }}>
                                </div>
                                <div className="tableTitlePulseAnimation-2" style={this.state.searchBarExtended ? { "--ScaleMultiplier": .75 } : { "--ScaleMultiplier": 2 }}>
                                </div>
                                <div className="tableTitlePulseAnimation-3" style={this.state.searchBarExtended ? { "--ScaleMultiplier": .75 } : { "--ScaleMultiplier": 2 }}>
                                </div>
                                <span className="tableTitle">{this.props.settings.title}</span>
                            </div>}
                        <SearchBar className={"searchHotBar"} onClick={this.toggleSearchBar} toggleTagMacros={this.props.handles} searchCallBack={this.searchCallBack} persist={this.props.showBottomMenu} toolTip={<div>


                            <h6>(!interest)</h6>
                            <p>
                                ! is short for NOT, entires with column value equals to interest will be removed from the list
                            </p>
                        </div>}></SearchBar>
                        <IconButton title={"Refresh"} size={"48px"} icon={
                            <i className="bi bi-arrow-clockwise" onClick={this.props.requestRefresh}></i>
                        }>
                        </IconButton>
                        {this.props.showBottomMenu ? "" :
                            <div>
                                <TableQuickAction handles={this.props.handles}
                                    actions={this.props.actions}></TableQuickAction></div>}
                    </div>
                </div>
                <HeaderExpansion 
                perms = {this.props.perms}
                settings={this.props.settings} 
                requestRefresh={this.props.requestRefresh} 
                fieldSettings={this.props.fieldSettings} 
                expanded={this.props.expanded} 
                component={this.props.component}
                handleClose={this.props.handleClose} 
                data = {this.props.data}
                requestError = {this.props.requestError}
                extraComponents = {this.props.extraComponents}
                actions={this.props.actions}
                >
                </HeaderExpansion>
                <DivSpacing spacing={1}></DivSpacing>
                <TagsBox showlabel={true} enableDeleteAll={true} className=" p-2" deleteAllTags={this.deleteAllTags}>
                    {this.state.currentTags.map((tag, index) => {
                        return <SearchTags onCancelClick={() => this.onCancelClick(tag)} type={tag.type} key={index}>{tag.value}</SearchTags>
                    })}
                </TagsBox>
                <DivSpacing spacing={1}></DivSpacing>
            </div>
        )
    }
}
TableHeader.defaultProps = {
    component: "",
}

export class HeaderExpansion extends React.Component {
    state={
        currentStep: 0,
        steps: [],
        expanded:false,
    }
    componentDidMount(){
        let steps = {}
        let componentsToRender = [];
        if(this.props.perms.Create){
            steps[Object.keys(steps).length] = "add"
            componentsToRender.push(<AddEntry settings={this.props.settings} requestRefresh={this.props.requestRefresh} fieldSettings = {this.props.fieldSettings} requestError={this.props.requestError}></AddEntry>)
        }
        if(this.props.perms.Delete){
            steps[Object.keys(steps).length] = "del"
            componentsToRender.push(<DeleteEntry settings={this.props.settings} requestRefresh={this.props.requestRefresh} fieldSettings = {this.props.fieldSettings} requestError={this.props.requestError}></DeleteEntry>)
        }
        steps[Object.keys(steps).length] = "gs"
        componentsToRender.push(<GenerateSpreadsheet settings={this.props.settings} requestRefresh={this.props.requestRefresh} fieldSettings = {this.props.fieldSettings} data={this.props.data} requestError={this.props.requestError}></GenerateSpreadsheet>)
        this.props.extraComponents.forEach((component)=>{
            steps[Object.keys(steps).length] = component.key
            componentsToRender.push(component.component)
        })
        this.setState({
            steps: steps,
            componentsToRender: componentsToRender,
            currentStep: this.getKeyByValue(steps, this.props.component),
        })
    }

    getKeyByValue(obj, value){
        let key = Object.keys(obj).find(key => obj[key] === value);
        console.log(key);
        return parseInt(key);
    }

    componentDidUpdate(prevProps) {
        if(prevProps.component != this.props.component){
            this.setState({
                currentStep: this.getKeyByValue(this.state.steps, this.props.component),
            })
        }
        if(prevProps.expanded != this.props.expanded){
            this.setState({
                expanded: this.props.expanded,
            })
        }
    }

    render() {
            return (
                this.state.expanded?
                <HeaderExpansionPane handleClose={this.props.handleClose} title={this.props.actions[this.state.currentStep].label}>
                    <MultiStepBox currentStep = {this.state.currentStep} steps={this.state.steps}>
                        {this.state.componentsToRender.map((component, index) => {
                            return (React.cloneElement(component, {key: index}))
                        })}
                    </MultiStepBox>
                </HeaderExpansionPane>
                :
                <div></div>
            )

    }
}
class HeaderExpansionPane extends React.Component {
    render() {
        return (
            <div className="p-4 headerExpansionPane">
                <div className={"panelCloseBtn d-flex justify-content-between align-items-center"}>
                    <h1>{this.props.title}</h1>
                    <IconButtonWithText className={"invert"} icon={<i className="bi bi-x"></i>} onClick={this.props.handleClose} label={"Close"}></IconButtonWithText>
                </div>
                {this.props.children}
            </div>
        )
    }


}

class AddEntry extends React.Component{
    state = {
        courseToAdd: {},
    }

    onChange = (field, value) => {
        var tempCourse = this.state.courseToAdd;
        tempCourse[field] = value;
        this.setState({
            courseToAdd: tempCourse
        })
    }

    uploadFile = async (file) => {
        console.log(file);
        const formData = new FormData();
        formData.append("file", file.FileUrl);
        
        return await fetch("/api/File/Upload",
            {
                method: "POST",
                body: formData,
            }
        ).then((res) => {
            console.log(res);
            return res.json();
        }).catch(err => {
            console.log(err);
        })
    }

    createCourse = async (courseToAdd) => {

        return fetch(this.props.settings.api + "Create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(courseToAdd),
        }).then((res => {
            return res.json();
        })).catch((err) => {
            console.log(err);
        })
    }

    handleCourseCreation = async (e) => {
        e.preventDefault();
        var courseToAdd = this.state.courseToAdd;
        var fileUploadFields = [];
        
        for(const field of Object.keys(this.props.fieldSettings)){
            if (this.props.fieldSettings[field].type === "file") {
                fileUploadFields.push(field);
            }
        }

        for(const field of fileUploadFields){
            try {
                const res = await this.uploadFile(courseToAdd[field]);
                if(res.success){
                    courseToAdd[field] = res.data;
                }
            }catch(e){
                this.props.requestError(e);
            }
        }
        try {
            const res = await this.createCourse(courseToAdd);
            if(res.success){
                this.props.requestRefresh();
            }else{
                this.props.requestError(res.message);
            }
        }catch(e){
            this.props.requestError(e);
        }
    }

    render(){
        return (
            <div className="container-fluid addEntry">
                <form className={"addEntry-inputFields"} onSubmit={this.handleCourseCreation}>
                {Object.keys(this.props.fieldSettings).map(
                    (key, index) => {
                        return (this.props.fieldSettings[key].primaryKey? "" : 
                            <StdInput 
                            label = {this.props.fieldSettings[key].displayLabel}
                            type={this.props.fieldSettings[key].type}
                            enabled = {true}
                            fieldLabel={key}
                            onChange = {this.onChange}
                            options={this.props.fieldSettings[key].options}
                            dateFormat = {this.props.fieldSettings[key].dateFormat}
                            allowEmpty = {true}
                            toolTip = {this.props.fieldSettings[key].toolTip}
                            >
                            </StdInput>)
                    }
                )}
                <StdButton type={"submit"}>Submit</StdButton>
            
                </form>
                </div>
        )
    }
}

class DeleteEntry extends React.Component{
    state = {
        courseToDelete: {},
    }

    onChange = (field, value) => {
        var tempCourse = this.state.courseToDelete;
        tempCourse[field] = value;
        this.setState({
            courseToDelete: tempCourse
        })
    }

    deleteCourse = async (courseToDelete) => {
        console.log(courseToDelete);
        return fetch(this.props.settings.api + "Delete", {
            method: "Delete",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(courseToDelete),
        }).then((res => {
            return res.json();
        }));
    }

    handleCourseDeletion = async (e) => {
        e.preventDefault();
        await this.deleteCourse(this.state.courseToDelete).then((content) => {
            if(content.success){
                this.props.requestRefresh();
            }else{
                this.props.requestError(content.message);
            }
        })
    }

    render(){
        return (
            <div className="container-fluid deleteEntry">
                <form className={"deleteEntry-inputFields"} onSubmit={this.handleCourseDeletion}>
                {Object.keys(this.props.fieldSettings).map(
                    (key, index) => {
                        return (this.props.fieldSettings[key].primaryKey? 
                            <StdInput 
                            label = {this.props.fieldSettings[key].displayLabel}
                            type={"text"}
                            enabled = {true}
                            fieldLabel={key}
                            onChange = {this.onChange}
                            options={this.props.fieldSettings[key].options}
                            dateFormat = {this.props.fieldSettings[key].dateFormat}
                            >
                            </StdInput> : "")
                    }
                )}
                <StdButton type={"submit"}>Submit</StdButton>
            
                </form>
            </div>
        )
    }
}

class GenerateSpreadsheet extends React.Component{
    state={
        columns: [],
        spreadsheetReady: false,
    }
    
    componentDidMount(){
        let columns = [];
        for(var i = 0; i < Object.keys(this.props.fieldSettings).length; i++){
            columns.push(
                {
                    label: Object.keys(this.props.fieldSettings)[i],
                    key: Object.keys(this.props.fieldSettings)[i],
                }
            );
        }
        this.setState({
            columns: columns
        });
    }

    reOrderColumns = (index, direction) => {
        var tempColumns = this.state.columns;
        if(direction === "up"){
            if(index > 0){
                var temp = tempColumns[index];
                tempColumns[index] = tempColumns[index - 1];
                tempColumns[index - 1] = temp;
            }
        } else {
            if(index < tempColumns.length - 1){
                var temp = tempColumns[index];
                tempColumns[index] = tempColumns[index + 1];
                tempColumns[index + 1] = temp;
            }
        }
        this.setState({
            columns: tempColumns
        });
    }

    generateSpreadsheet = () =>{
        this.setState({
            spreadsheetReady : false
        })

        // Fake loading time to show false sense of progress
        setTimeout(() => {
            this.setState({
                spreadsheetReady : true
            })}, 1000);
    }

    render(){
        return (
            <div className="container-fluid generate-spreadsheet">
                <div className="column-order">
                    {this.state.columns.map((column, index) => {
                        return <div className="column">
                            <div className="column-order-buttons">
                                <IconButton className={"invert"} icon={<i className="bi bi-arrow-up"></i>} onClick={() => this.reOrderColumns(index, "up")}></IconButton>
                                <IconButton className={"invert"} icon={<i className="bi bi-arrow-down"></i>} onClick={() => this.reOrderColumns(index, "down")}></IconButton>
                            </div>
                            <div className="column-name">{column.label}</div>
                        </div>
                    })}     
                </div>
                <div className="generate-actions">
                    <StdButton onClick={() => this.generateSpreadsheet()}>
                        Generate Spreadsheet
                    </StdButton>

                    {this.state.spreadsheetReady ?
                    
                    <CSVLink data={this.props.data} className={"forget-password"} headers={this.state.columns} filename={this.props.settings.title + ".csv"}>Download</CSVLink>
                    :
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    }    
                </div>
            </div>
        )
    }

    
}

class ColumnSettings extends React.Component {
    render() {
        return (
            <div className="col-12">

            </div>
        )
    }
}

class TagMacros extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentMode: "default",
            editable: true
        }
        this.toggleEditMode = this.toggleEditMode.bind(this);
        this.toggleAddMode = this.toggleAddMode.bind(this);
    }

    componentDidMount() {
        window.addEventListener("resize", this.resize.bind(this));
        this.resize();
    }

    toggleEditMode() {
        console.log(this.state)
        if (this.state.currentMode === "default") {
            this.setState({
                currentMode: "edit"
            })
        } else {
            this.setState({
                currentMode: "default"
            })
        }
    }

    toggleAddMode() {

        if (this.state.currentMode === "default") {
            this.setState({
                currentMode: "add"
            })
        } else {
            this.setState({
                currentMode: "default"
            })
        }
    }

    resize() {
        const md = 768;
        if (window.innerWidth >= md) {
            this.setState({
                editable: true
            })
        } else {
            this.setState({
                editable: false
            })
        }
    }
    render() {
        if (this.state.currentMode === "edit") {
            return (
                <TagMacrosEditMode toggleEditMode={this.toggleEditMode} currentTags={[
                    { type: "base", value: ":fast" },
                    { type: "specific", value: "@agreement(abc)" },
                    { type: "specific", value: "@birthdayAfter(09-10)" },
                    { type: "specific", value: "@dorm(abc)" },
                    { type: "multiple", value: "+level(3)" }]}></TagMacrosEditMode>
            )
        }

        if (this.state.currentMode === "add") {
            return (
                <TagMacrosAddMode toggleEditMode={this.toggleAddMode}></TagMacrosAddMode>
            )
        }
        return (
            <div className="container-fluid tagMacros">
                <div className="d-flex flex-nowrap justify-content-between">
                    <div className="col-3">
                        Name
                    </div>
                    <div className="tagMacrosTagsBox">
                        Tags
                    </div>
                    <div className="ms-auto col-auto">
                        <IconButtonWithText className={"invert"} icon={<i className="bi bi-plus-circle-fill"></i>} label={"Add Macro"} onClick={this.toggleAddMode}></IconButtonWithText>
                    </div>
                </div>
                <div className="d-flex flex-nowrap justify-content-between">
                    <div className="col-3">
                        <StdInput prefix={"# "} value={"default"} editable={false} showIndicator={false}></StdInput>
                    </div>
                    <div className="tagMacrosTagsBox">
                        <TagsBox>
                            <SearchTags type={"base"} showRemove={false}>:active</SearchTags>
                        </TagsBox>
                    </div>
                    <div className="ms-auto  col-auto">
                    </div>
                </div>
                <div className="d-flex flex-nowrap justify-content-between">
                    <div className="col-3">
                        <StdInput prefix={"# "} value={"test"} editable={this.state.editable} showIndicator={false}></StdInput>
                    </div>
                    <div className="tagMacrosTagsBox">
                        <TagsBox truncate={true}>
                            <SearchTags type={"specific"} showRemove={true}>@lastActivityBefore(10-10-1990)</SearchTags>
                            <SearchTags type={"multiple"} showRemove={true}>+level(3)</SearchTags>
                            <SearchTags type={"multiple"} showRemove={true}>+lastActivityBefore(10-10-1990)</SearchTags>
                            <SearchTags type={"exclude"} showRemove={true}>(!abc)</SearchTags>
                            <SearchTags type={"specific"} showRemove={true}>@lastActivityBefore(10-10-1990)</SearchTags>
                            <SearchTags type={"multiple"} showRemove={true}>+level(3)</SearchTags>
                            <SearchTags type={"multiple"} showRemove={true}>+lastActivityBefore(10-10-1990)</SearchTags>
                            <SearchTags type={"exclude"} showRemove={true}>(!abc)</SearchTags>
                        </TagsBox>
                    </div>
                    <div className="align-items-start">
                        <IconButton icon={<i className="bi bi-pencil"></i>} className={"invert"} onClick={this.toggleEditMode}></IconButton>
                    </div>
                </div>
            </div>
        )
    }
}

export class TagMacrosEditMode extends React.Component {

    constructor(props) {
        super(props);
        this.isTextEmpty = this.isTextEmpty.bind(this);
        this.setStep = this.setStep.bind(this);
        this.onCancelClick = this.onCancelClick.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.onTagSelect = this.onTagSelect.bind(this);
        this.state = {
            textEmpty: true,
            step: 1,
            macroName: "",
            currentTags: this.props.currentTags,
            tagType: "",
            selectedTag: "",
            suggestions: searchSuggestions,
            placeholder: "",
            tagInteralValue: ""
        }
    }

    onCancelClick(tagToRemove) {
        this.setState({
            currentTags: this.state.currentTags.filter((tag) => tag !== tagToRemove),
        })
    }

    onTagSelect = (tag) => {
        console.log("value: " + tag.value, "type: " + tag.type);
        this.setState({
            tagType: tag.type,
            selectedTag: tag.value
        })

        if (tag.value.slice(1) === "gender") {
            this.setState({
                suggestions: [{ value: "Male", label: "Male", type: "" }, { value: "Female", label: "Female", type: "" }],
                placeholder: "Enter a gender",
            })
        }
    }

    tagSelectCallBack = (tag) => {
        this.setState({
            currentTags: [...this.state.currentTags, tag],
            suggestions: searchSuggestions,
            placeholder: "",
        })
    }

    onSubmit(tagToAdd) {
        console.log("value" + tagToAdd.value, tagToAdd.type);
        this.setState({
            currentTags: [...this.state.currentTags, tagToAdd],
            selectedTag: "",
            tagType: "",
        })
    }

    setStep(step) {
        this.setState({
            step: step,
            textEmpty: true
        })
    }

    isTextEmpty(e) {
        console.log(e.target.value)
        if (e.target.value === undefined || e.target.value === "") {
            this.setState({
                textEmpty: true,
                tagInteralValue: ""
            })
        } else {
            this.setState({
                textEmpty: false,
                tagInteralValue: e.target.value
            })

        }
    }

    render() {
        return (
            <div className="container-fluid tagMacros d-flex flex-column align-items-center">
                <div className="col-12 d-flex justify-content-between align-items-center">
                    Editing Macro: {"Test"}
                </div>

                {this.state.step === 1 ?
                    // Step 1
                    <div className="tagMacros col-xl-6 col-lg-8 col-12 row-cols-1 justify-content-stretch align-items-stretch">
                        <div className="d-flex flex-column justify-content-center align-items-center">
                            <h6 className="text-center">
                                Current Tags
                            </h6>
                            <DivSpacing spacing={1}></DivSpacing>
                            <TagsBox className={"tagCloud"}>
                                {this.state.currentTags.map((tag, index) => {
                                    return <SearchTags type={tag.type} key={index} onCancelClick={() => this.onCancelClick(tag)}>{tag.value}</SearchTags>
                                })}
                            </TagsBox>
                        </div>
                        <div className={"col-12"}>
                            <StdInput tagSelectCallBack={this.tagSelectCallBack} label={"Add Tags"} placeholder={this.state.placeholder} type={"dropdown-tags"} onTagSelect={this.onTagSelect} options={this.state.suggestions} editable={true} showIndicator={false} showSaveBtn={false} isTextEmpty={this.isTextEmpty}></StdInput>
                        </div>
                        <div className="d-flex col-12 justify-content-center">
                            <div className={"col-md-4 col-12 align-self-center"}>
                                <div className={"row"}>
                                    <div className={"col-6"}>
                                        <StdButton className="borderless w-100" onClick={this.props.toggleEditMode}>Cancel</StdButton>
                                    </div>
                                    <div className={"col-6"}>
                                        {this.state.textEmpty ?
                                            <StdButton className=" primary w-100" onClick={() => { this.setStep(2) }}>Submit</StdButton> : <StdButton className=" secondary w-100" disabled={this.state.selectedTag === ""} onClick={() => this.onSubmit({ value: this.state.selectedTag + "(" + this.state.tagInteralValue + ")", type: this.state.tagType })}>Add Tag</StdButton>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    :
                    // Step 2
                    <div className="tagMacros col-xl-6 col-lg-8 col-12 justify-content-stretch align-items-center">
                        <div className={"col-12"}>
                            <StdInput label={"Macro Name"} editable={true} showIndicator={false} showSaveBtn={false} value={this.state.macroName} isTextEmpty={this.isTextEmpty}></StdInput>
                        </div>
                        <div className="d-flex flex-column justify-content-center align-items-center">
                            <h6 className="text-center">
                                Current Tags
                            </h6>
                            <DivSpacing spacing={1}></DivSpacing>
                            <TagsBox className={"tagCloud"} onClick={() => { this.setStep(1) }}>
                                <SearchTags type={"specific"} showRemove={false}>@lastActivityBefore(10-10-1990)</SearchTags>
                                <SearchTags type={"multiple"} showRemove={false}>+level(3)</SearchTags>
                                <SearchTags type={"multiple"} showRemove={false}>+lastActivityBefore(10-10-1990)</SearchTags>
                                <SearchTags type={"exclude"} showRemove={false}>(!abc)</SearchTags>
                                <SearchTags type={"specific"} showRemove={false}>@lastActivityBefore(10-10-1990)</SearchTags>
                                <SearchTags type={"multiple"} showRemove={false}>+level(3)</SearchTags>
                                <SearchTags type={"multiple"} showRemove={false}>+lastActivityBefore(10-10-1990)</SearchTags>
                                <SearchTags type={"exclude"} showRemove={false}>(!abc)</SearchTags>
                            </TagsBox>
                        </div>
                        <div className="d-flex col-12 justify-content-center">
                            <div className={"col-md-4 col-12 align-self-center"}>
                                <div className={"row"}>
                                    <div className={"col-6"}>
                                        <StdButton className="borderless w-100" onClick={() => { this.setStep(1) }}>Back</StdButton>
                                    </div>
                                    <div className={"col-6"}>
                                        <StdButton className=" primary w-100" onClick={() => { this.onSubmit({ type: this }) }} disabled={this.state.textEmpty ? true : false}>Submit</StdButton>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            </div>
        )
    }
}
TagMacrosEditMode.defaultProps = {
    currentTags: [],
    suggestions: [],
}

export class TagMacrosAddMode extends React.Component {

    constructor(props) {
        super(props);
        this.isTextEmpty = this.isTextEmpty.bind(this);
        this.setStep = this.setStep.bind(this);
        this.state = {
            textEmpty: true,
            step: 1,
            macroName: "",
        }
    }

    setStep(step) {
        this.setState({
            step: step,
            textEmpty: true
        })
    }

    isTextEmpty(e) {
        console.log(e.target.value)
        if (e.target.value === undefined || e.target.value === "") {
            this.setState({
                textEmpty: true
            })
        } else {
            this.setState({
                textEmpty: false
            })
        }
    }

    render() {
        return (
            <div className="container-fluid tagMacros d-flex flex-column align-items-center">
                <div className="col-12 d-flex justify-content-between align-items-center">
                    Creating New Macro
                </div>
                {this.state.step === 1 ?
                    // Step 1
                    <div className="tagMacros col-md-4 col-12 justify-content-stretch align-items-center">
                        <div className="d-flex flex-column justify-content-center align-items-center">
                            <h6 className="text-center">
                                Current Tags
                            </h6>
                            <DivSpacing spacing={1}></DivSpacing>
                            <TagsBox className={"tagCloud"}>
                            </TagsBox>
                        </div>
                        <div className={"col-12"}>
                            <StdInput label={"Add Tags"} type={"dropdown-tags"} options={searchSuggestions} editable={true} showIndicator={false} showSaveBtn={false} isTextEmpty={this.isTextEmpty}></StdInput>
                        </div>
                        <div className="d-flex col-12 justify-content-center">
                            <div className={"col-md-4 col-12 align-self-center"}>
                                <div className={"row"}>
                                    <div className={"col-6"}>
                                        <StdButton className=" borderless w-100" onClick={this.props.toggleEditMode}>Cancel</StdButton>
                                    </div>
                                    <div className={"col-6"}>
                                        {this.state.textEmpty ?
                                            <StdButton className=" primary w-100" onClick={() => { this.setStep(2) }}>Submit</StdButton> : <StdButton className=" secondary w-100">Add Tag</StdButton>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    :
                    // Step 2
                    <div className="tagMacros col-md-4 col-12 justify-content-stretch align-items-center">
                        <div className={"col-12"}>
                            <StdInput label={"Macro Name"} editable={true} showIndicator={false} showSaveBtn={false} value={this.state.macroName} isTextEmpty={this.isTextEmpty}></StdInput>
                        </div>
                        <div className="d-flex flex-column justify-content-center align-items-center">
                            <h6 className="text-center">
                                Current Tags
                            </h6>
                            <DivSpacing spacing={1}></DivSpacing>
                            <TagsBox className={"tagCloud"}>
                            </TagsBox>
                        </div>
                        <div className="d-flex col-12 justify-content-center">
                            <div className={"col-md-4 col-12 align-self-center"}>
                                <div className={"row"}>
                                    <div className={"col-6"}>
                                        <StdButton className="borderless w-100" onClick={() => { this.setStep(1) }}>Back</StdButton>
                                    </div>
                                    <div className={"col-6"}>
                                        <StdButton className=" primary w-100" disabled={this.state.textEmpty ? true : false}>Submit</StdButton>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>}
            </div>
        )
    }
}

export class TableFooter extends React.Component {
    render() {
        return (
            this.props.showBottomMenu ?
                <ActionsButton className={"fixed-bottom footer-Btn"} onClick={this.props.toggle}></ActionsButton> : ""
        )
    }
}

export class TableQuickAction extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showActionsMenu: false,
            actionsMenuClasses: "actionsMenu",
            actionsButtonClasses: "actionsMenuToggle"
        }
    }
    render() {

        return (
            <div className="d-flex quickActionsPanel align-items-center">
                <ActionsButton onClick={() => {
                    if (this.state.showActionsMenu) {
                        this.setState({
                            showActionsMenu: !this.state.showActionsMenu,
                            actionsMenuClasses: "actionsMenu cardBg",
                            actionsButtonClasses: "actionsMenuToggle"
                        })
                    } else {

                        this.setState({
                            showActionsMenu: !this.state.showActionsMenu,
                            actionsMenuClasses: "actionsMenu cardBg showActions",
                            actionsButtonClasses: "actionsMenuToggle active"
                        })
                    }
                }}>
                    {this.props.actions.map((action, index) => {
                        return (
                            <DrawerItemNonLink key={index} label={action.label} onClick={action.onClick}></DrawerItemNonLink>
                        )

                    })}
                </ActionsButton>
            </div>
        )
    }
}

export class BottomMenu extends React.Component {
    render() {
        return (
            this.props.showBottomMenu ?
                <SlideDrawer show={this.props.show} direction={"bot"} columns={1} settings={settings}>
                    {this.props.actions.map((action, index) => {
                        return (
                            <DrawerItemNonLink key={index} label={action.label} width={"25"} onClick={action.onClick}></DrawerItemNonLink>
                        )

                    })}</SlideDrawer> : <div></div>
        )
    }
}
