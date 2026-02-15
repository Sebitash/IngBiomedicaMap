import {
  Badge,
  Box,
  Flex,
  LightMode,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  Text,
} from "@chakra-ui/react";
import React from "react";
import { GraphContext, UserContext } from "../../MapContext";
import { promediar } from "../../utils";

const NON_MATERIA_CATEGORIAS = new Set([
  "CBC",
  "CPU",
  "Fin de Carrera",
  "Fin de Carrera (Obligatorio)",
]);

const StatusBar = () => {
  const { getters, toggleCheckbox } = React.useContext(GraphContext);
  const { user } = React.useContext(UserContext);

  const materias = React.useMemo(
    () =>
      getters
        .ALL()
        .filter((n) => !NON_MATERIA_CATEGORIAS.has(n.categoria)),
    [getters],
  );

  const materiasAprobadas = React.useMemo(
    () => materias.filter((n) => n.aprobada && n.nota >= 0).length,
    [materias],
  );

  const obligatoriasTotal = React.useMemo(
    () => getters.CategoriaOnly("Materias Obligatorias").length,
    [getters],
  );

  const obligatoriasAprobadas = React.useMemo(
    () => getters.ObligatoriasAprobadas().length,
    [getters],
  );

  const obligatoriasPercent = React.useMemo(() => {
    if (!obligatoriasTotal) return 0;
    return Math.round((obligatoriasAprobadas / obligatoriasTotal) * 100);
  }, [obligatoriasAprobadas, obligatoriasTotal]);

  const promedio = React.useMemo(
    () => promediar(getters.MateriasAprobadasSinCBC()),
    [getters],
  );

  const checkboxes = user.carrera.creditos.checkbox ?? [];

  return (
    <Flex
      alignItems="center"
      gap={4}
      px={4}
      py={2}
      flexWrap="wrap"
      w="100%"
    >
      <Flex alignItems="center" gap={4} flex="1" minW="32ch">
        <Box minW="16ch">
          <Stat color="white" size="sm">
            <StatLabel>Materias aprobadas</StatLabel>
            <StatNumber>
              {materiasAprobadas} de {materias.length}
            </StatNumber>
          </Stat>
        </Box>

        <Badge colorScheme="green" variant="solid">
          CPU
        </Badge>

        <Box flex="1" minW="24ch">
          <Stat color="white" size="sm">
            <StatLabel>Obligatorias</StatLabel>
            <StatNumber>
              {obligatoriasAprobadas} de {obligatoriasTotal} {" "}
              <Badge colorScheme="green" variant="solid">
                {obligatoriasPercent}%
              </Badge>
            </StatNumber>
          </Stat>
          <Progress
            mt={1}
            height={3}
            borderRadius={3}
            max={100}
            value={obligatoriasPercent}
            colorScheme="obligatorias"
            sx={{ "& > div:first-of-type": { transitionProperty: "width" } }}
          />
        </Box>
      </Flex>

      <Flex alignItems="center" gap={4} ml="auto" flexWrap="wrap">
        <Flex alignItems="center" gap={4} flexWrap="wrap">
          {checkboxes.map((c) => (
            <LightMode key={c.nombre}>
              <Box
                cursor="pointer"
                minW="14ch"
                onClick={(e) => {
                  e.preventDefault();
                  toggleCheckbox(c.nombre);
                }}
              >
                <Text color="white" fontSize="sm" mb={1}>
                  {c.nombre}
                </Text>
                <Progress
                  height={2}
                  borderRadius={3}
                  max={100}
                  value={c.check ? 100 : 0}
                  colorScheme={c.color}
                  sx={{ "& > div:first-of-type": { transitionProperty: "width" } }}
                />
              </Box>
            </LightMode>
          ))}
        </Flex>

        <Box minW="12ch">
          <Stat color="white" size="sm" textAlign="right">
            <StatLabel>Promedio</StatLabel>
            <StatNumber>{promedio}</StatNumber>
          </Stat>
        </Box>
      </Flex>
    </Flex>
  );
};

export default StatusBar;
