import {Card, CardBody, CardContent} from "@salutejs/plasma-ui/components/Card";
import {H3, H5} from "@salutejs/plasma-ui";
import React from "react";


const club_to_short = {
    'Зенит': 'ЗЕН',
    'Факел': 'ФКЛ',
    'Крылья Советов': 'КС',
    'Спартак': 'СПА',
    'Нижний Новгород': 'ПАРИ',
    'Химки': 'ХИМ',
    'Локомотив': 'ЛОКО',
    'Торпедо': 'ТОР',
    'ФК Ахмат': 'АХМ',
    'ФК Краснодар': 'КРА',
    'ЦСКА': 'ЦСКА',
    'ФК Ростов': 'РОС',
}


export function CustomCard(props) {

    return (
        <Card
            style={{
                outline: 'none',
                height: window.innerHeight * 0.15,
                width: window.innerWidth * (1 - 0.03 * props.length) / props.length
            }}
        >
            <CardBody>
                <CardContent>
                    {
                        props.i === 0 ?
                            <>
                                <H5>Справка</H5>
                            </>:
                            <>
                                <H3>{club_to_short[props.item.team1.club]}</H3>
                                <H3>{club_to_short[props.item.team2.club]}</H3>
                            </>
                    }
                </CardContent>
            </CardBody>
        </Card>
    )
}