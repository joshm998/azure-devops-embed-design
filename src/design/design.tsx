import "azure-devops-ui/Core/override.css";
import "./design.scss";

import { WorkItemOptions, WorkItemTrackingServiceIds, IWorkItemFormService } from "azure-devops-extension-api/WorkItemTracking/WorkItemTrackingServices";
import * as SDK from "azure-devops-extension-sdk";
import { Page } from "azure-devops-ui/Page";
import { SingleLayerMasterPanel, SingleLayerMasterPanelHeader } from "azure-devops-ui/MasterDetails";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { IListItemDetails, List, ListItem, ListSelection } from "azure-devops-ui/List";

import { ZeroData } from "azure-devops-ui/ZeroData";
import { useState, useEffect } from "react";

import * as ReactDOM from "react-dom";
import React = require("react");
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";


const URL_REGEX = (/https:\/\/([\w\.-]+\.)?figma.com\/(file|proto)\/([0-9a-zA-Z]{22,128})(?:\/.*)?$/)

const Hub: React.FC<{}> = (props: any) => {
    const [designs, setDesigns] = useState([] as string[]);
    const [selectedItem, setSelectedItem] = useState(null as String | null);
    const [selection] = React.useState(new ListSelection({ selectOnFocus: false }));

    const [itemProvider, setItemProvider] = React.useState(new ArrayItemProvider(designs));

    useEffect(() => {
        SDK.init().then(async () => {
            await registerEvents();
        });
    }, []);

    const registerEvents = async () => {
        var workItemFormService = await SDK.getService<IWorkItemFormService>(WorkItemTrackingServiceIds.WorkItemFormService);
        var description = (await workItemFormService.getFieldValue("System.Description", ({} as WorkItemOptions)) as string);
        var doc = document.createElement("html");
        doc.innerHTML = description;
        var links = doc.getElementsByTagName("a");
        var urls = [] as string[];

        for (var i = 0; i < links.length; i++) {
            var url = links[i].getAttribute("href");

            const match = url!.match(URL_REGEX)
            if (match) {
                urls.push(url!);
            }
        }

        setDesigns(urls);
        setItemProvider(new ArrayItemProvider(urls));

        console.log(selection);

        console.log(urls);
        console.log(selectedItem)
    };

    const renderHeader = () => {
        return <SingleLayerMasterPanelHeader title="Designs" />;
    };

    const renderContent = (selection: ListSelection, itemProvider: ArrayItemProvider<string>) => {
        return (
            <List
                ariaLabel={"List of Designs"}
                itemProvider={itemProvider}
                selection={selection}
                renderRow={renderListItem}
                width="100%"
                onFocus={(a, b) => setSelectedItem(b.data)}
                singleClickActivation={true}
            />
        );
    };

    const renderListItem = (
        index: number,
        item: string,
        details: IListItemDetails<string>,
        key?: string
    ): JSX.Element => {

        return (
            <ListItem
                className="master-example-row"
                key={key || "list-item" + index}
                index={index}
                details={details}
            >
                <div className="master-example-row-content flex-row flex-center h-scroll-hidden">
                    <Tooltip overflowOnly={true}>
                        <div className="primary-text text-ellipsis">{item}</div>
                    </Tooltip>
                </div>
            </ListItem>
        );
    };

    return (
        <Page className="flex-grow">
            {designs.length > 0 ?
                <div className="master-example-scroll-container flex-row">
                    <SingleLayerMasterPanel
                        className="master-example-panel show-on-small-screens"
                        renderHeader={renderHeader}
                        renderContent={() => renderContent(selection, itemProvider)}
                    />
                    {selectedItem != null ? <Page className="flex-grow single-layer-details">
                        <iframe className="design-frame" src={`https://www.figma.com/embed?embed_host=azuredevops&url=${selectedItem}`} />
                    </Page> : <div></div>}

                </div> :
                <ZeroData imageAltText="No Designs Found" primaryText="No Designs Found..." secondaryText={<span>
                    Add design links in the description of the work item for them to show here.
                </span>} />}
        </Page>
    );

};

ReactDOM.render(<Hub />, document.getElementById("root"));
