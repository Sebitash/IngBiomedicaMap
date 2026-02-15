import React from "react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  Tooltip,
  Box,
  Text,
  Hide,
  Show,
  Badge,
  MenuItem,
  useColorModeValue,
  BadgeProps,
  ResponsiveValue,
} from "@chakra-ui/react";
import { Property } from "csstype";
import { CARRERAS, PLANES } from "../../carreras";
import { GraphContext, UserContext } from "../../MapContext";

const AnoBadge = ({
  ano,
  active,
  ...rest
}: { ano: number; active: boolean } & BadgeProps) => {
  const activeVariant = useColorModeValue("solid", "subtle");
  const commonProps = {
    mx: 1,
    variant: active ? activeVariant : "outline",
    textAlign: "center" as ResponsiveValue<Property.TextAlign>,
    colorScheme: "gray",
    ...rest,
  };
  if (ano === 2020) {
    return (
      <Badge {...commonProps} fontSize="x-small" colorScheme="green">
        PLAN <br /> 2020
      </Badge>
    );
  }
  return (
    <Badge {...commonProps} fontSize="small">
      {ano}
    </Badge>
  );
};

// Componente para elegir carrera
const DropdownCarreras = () => {
  const { user } = React.useContext(UserContext);
  const { changeCarrera } = React.useContext(GraphContext);

  const carrera = React.useMemo(() => {
    const plan = PLANES.find((p) => p.planes.includes(user.carrera.id));
    const { nombre = "", nombrecorto = "" } = plan || {};
    return { nombre, nombrecorto };
  }, [user.carrera.id]);

  return (
    <Box key={user.carrera.id}>
      <Menu placement="bottom" isLazy>
        <Tooltip
          placement="bottom"
          label={
            user.carrera.beta && (
              <Box fontSize="xs">
                <Text>Los planes nuevos cambian todo el tiempo.</Text>
                <Text>
                  Esto puede estar desactualizado frente a los últimos anuncios.
                </Text>
                <Text>
                  Haceme saber si falta alguna actualización sustancial del
                  plan.
                </Text>
              </Box>
            )
          }
        >
          <MenuButton
            colorScheme="whiteAlpha"
            variant="outline"
            color="white"
            borderRadius="md"
            as={Button}
            mr={2}
            rightIcon={<ChevronDownIcon />}
          >
            {user.carrera.beta && (
              <Badge variant="subtle" mr={1} colorScheme="purple">
                BETA
              </Badge>
            )}
            {/* Hardcoded to chakra md breakpoint */}
            <Show ssr={false} breakpoint="(max-width: 48em)">
              {carrera.nombrecorto}
            </Show>
            <Hide ssr={false} breakpoint="(max-width: 48em)">
              {carrera.nombre}
            </Hide>
            <AnoBadge ano={user.carrera.ano} active={true} />
          </MenuButton>
        </Tooltip>
        <MenuList overflowY="auto" maxHeight="70vh">
          {PLANES.map((p) => (
            <MenuItem
              key={p.nombrecorto}
              display="flex"
              justifyContent="space-between"
              {...(p.planes.length === 1
                ? {
                    onClick: () => {
                      changeCarrera(p.planes[0]);
                    },
                  }
                : { cursor: "default", closeOnSelect: false })}
            >
              <Text as={p.planes.includes(user.carrera.id) ? "b" : "p"}>
                {p.nombre}
              </Text>
              <Box ml={2}>
                {p.planes.map((c) => {
                  const plan = CARRERAS.find((carrera) => carrera.id === c);
                  if (!plan) return null;
                  const active = user.carrera.id === c;
                  return (
                    <AnoBadge
                      key={c}
                      ano={plan.ano}
                      active={active}
                      cursor="pointer"
                      onClick={() => {
                        changeCarrera(c);
                      }}
                      _hover={
                        !active && p.planes.length > 1 ? { border: "1px" } : {}
                      }
                    />
                  );
                })}
              </Box>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Box>
  );
};

export default DropdownCarreras;
