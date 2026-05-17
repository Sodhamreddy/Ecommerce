<?php
/*-----------------------------------------------------------------------------+
| API2Cart                                                                     |
| Copyright (c) 2026 API2Cart.com <manager@api2cart.com>                       |
| All rights reserved                                                          |
+------------------------------------------------------------------------------+
| PLEASE READ  THE FULL TEXT OF SOFTWARE LICENSE AGREEMENT IN THE "license.txt"|
| FILE PROVIDED WITH THIS DISTRIBUTION.                                        |
|                                                                              |
| THIS  AGREEMENT  EXPRESSES  THE  TERMS  AND CONDITIONS ON WHICH YOU MAY USE  |
| THIS SOFTWARE   PROGRAM   AND  ASSOCIATED  DOCUMENTATION   THAT  API2CART    |
| (hereinafter  referred to as "THE AUTHOR") IS FURNISHING  OR MAKING          |
| AVAILABLE TO YOU WITH  THIS  AGREEMENT  (COLLECTIVELY,  THE  "SOFTWARE").    |
| PLEASE   REVIEW   THE  TERMS  AND   CONDITIONS  OF  THIS  LICENSE AGREEMENT  |
| CAREFULLY   BEFORE   INSTALLING   OR  USING  THE  SOFTWARE.  BY INSTALLING,  |
| COPYING   OR   OTHERWISE   USING   THE   SOFTWARE,  YOU  AND  YOUR  COMPANY  |
| (COLLECTIVELY,  "YOU")  ARE  ACCEPTING  AND AGREEING  TO  THE TERMS OF THIS  |
| LICENSE   AGREEMENT.   IF  YOU    ARE  NOT  WILLING   TO  BE  BOUND BY THIS  |
| AGREEMENT, DO  NOT INSTALL OR USE THE SOFTWARE.  VARIOUS   COPYRIGHTS   AND  |
| OTHER   INTELLECTUAL   PROPERTY   RIGHTS    PROTECT   THE   SOFTWARE.  THIS  |
| AGREEMENT IS A LICENSE AGREEMENT THAT GIVES  YOU  LIMITED  RIGHTS   TO  USE  |
| THE  SOFTWARE   AND  NOT  AN  AGREEMENT  FOR SALE OR FOR  TRANSFER OF TITLE. |
| THE AUTHOR RETAINS ALL RIGHTS NOT EXPRESSLY GRANTED BY THIS AGREEMENT.       |
|                                                                              |
| The Developer of the Code is API2Cart,                                       |
| Copyright (C) 2006 - 2026 All Rights Reserved.                               |
+------------------------------------------------------------------------------+
|                                                                              |
|                            ATTENTION!                                        |
+------------------------------------------------------------------------------+
| By our Terms of Use you agreed not to change, modify, add, or remove portions|
| of Bridge Script source code as it is owned by API2Cart company.             |
| You agreed not to use, reproduce, modify, adapt, publish, translate          |
| the Bridge Script source code into any form, medium, or technology           |
| now known or later developed throughout the universe.                        |
|                                                                              |
| Full text of our TOS located at                                              |
|                       https://www.api2cart.com/terms-of-service              |
+-----------------------------------------------------------------------------*/

interface M1_Platform_Actions
{

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function productAddAction($a2cData);

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function productUpdateAction($a2cData);

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function productAddBatchAction($a2cData);

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function productUpdateBatchAction($a2cData);

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function sendEmailNotifications($a2cData);

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function sendReturnEmails($a2cData);

  /**
   * @return mixed
   */
  public function getPlugins();

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function triggerEvents($a2cData);

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function triggerEventsBatch($a2cData);

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function setMetaData($a2cData);


  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function getTranslations($a2cData);

  /**
   * @inheritDoc
   */
  public function getWdrPrice($a2cData);

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function setOrderNotes($a2cData);

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function getActiveModules($a2cData);

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function getImagesUrls($a2cData);

  /**
   * @param array $a2cData Data
   *
   * @return array
   */
  public function imageAdd($a2cData);

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function orderUpdate($a2cData);

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function categoryAdd($a2cData);

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function categoryUpdate($a2cData);

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function categoryDelete($a2cData);

  /**
   *
   * @return mixed
   */
  public function getPaymentMethods();

  /**
   *
   * @return mixed
   */
  public function cleanCache($a2cData);

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function createLiveShippingService($a2cData);

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function deleteLiveShippingService($a2cData);

  /**
   *
   * @return mixed
   */
  public function productDeleteAction($a2cData);

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function orderCalculate($a2cData);

}

abstract class M1_DatabaseLink
{
  protected static $_maxRetriesToConnect = 5;
  protected static $_sleepBetweenAttempts = 2;

  protected $_config = null;
  private $_databaseHandle = null;

  protected $_insertedId = 0;
  protected $_affectedRows = 0;

  /**
   * @param M1_Config_Adapter $config Config adapter
   * @return M1_DatabaseLink
   */
  public function __construct($config)
  {
    $this->_config = $config;
  }

  /**
   * @return void
   */
  public function __destruct()
  {
    $this->_releaseHandle();
  }
  
  /**
   * @return stdClass|bool
   */
  private function _tryToConnect()
  {
    $triesCount = self::$_maxRetriesToConnect;

    $link = null;

    while (!$link) {
      if (!$triesCount--) {
        break;
      }
      $link = $this->_connect();
      if (!$link) {
        sleep(self::$_sleepBetweenAttempts);
      }
    }

    if ($link) {
      $this->_afterConnect($link);
      return $link;
    } else {
      return false;
    }
  }

  /**
   * Database handle getter
   * @return stdClass
   */
  protected final function _getDatabaseHandle()
  {
    if ($this->_databaseHandle) {
      return $this->_databaseHandle;
    }
    if ($this->_databaseHandle = $this->_tryToConnect()) {
      return $this->_databaseHandle;
    } else {
      exit($this->_errorMsg('Can not connect to DB'));
    }
  }

  /**
   * Close DB handle and set it to null; used in reconnect attempts
   * @return void
   */
  protected final function _releaseHandle()
  {
    if ($this->_databaseHandle) {
      $this->_closeHandle($this->_databaseHandle);
    }
    $this->_databaseHandle = null;
  }

  /**
   * Format error message
   * @param string $error Raw error message
   * @return string
   */
  protected final function _errorMsg($error)
  {
    $className = get_class($this);
    return "[$className] MySQL Query Error: $error";
  }

  /**
   * @param string $sql       SQL query
   * @param int    $fetchType Fetch type
   * @param array  $extParams Extended params
   * @return array
   */
  public final function query($sql, $fetchType, $extParams)
  {
    if (!empty($this->_config->cartVars["dbCharset"])) {
      $this->_dbSetNames($this->_config->cartVars["dbCharset"]);
    } elseif (isset($extParams['set_names'])) {
      $this->_dbSetNames($extParams['set_names']);
    }

    return $this->_query($sql, $fetchType, $extParams['fetch_fields']);
  }

  /**
   * @return bool|null|resource
   */
  protected abstract function _connect();

  /**
   * Additional database handle manipulations - e.g. select DB
   * @param  stdClass $handle DB Handle
   * @return void
   */
  protected abstract function _afterConnect($handle);

  /**
   * Close DB handle
   * @param  stdClass $handle DB Handle
   * @return void
   */
  protected abstract function _closeHandle($handle);

  /**
   * @param string $sql sql query
   * @return array
   */
  public abstract function localQuery($sql);

  /**
   * @param string $sql         Sql query
   * @param int    $fetchType   Fetch Type
   * @param bool   $fetchFields Fetch fields metadata
   * @return array
   */
  protected abstract function _query($sql, $fetchType, $fetchFields = false);

  /**
   * @return string|int
   */
  public function getLastInsertId()
  {
    return $this->_insertedId;
  }

  /**
   * @return int
   */
  public function getAffectedRows()
  {
    return $this->_affectedRows;
  }

  /**
   * @param  string $charset Charset
   * @return void
   */
  protected abstract function _dbSetNames($charset);

}


class M1_Pdo extends M1_DatabaseLink
{
  public $noResult = array(
    'delete', 'update', 'move', 'truncate', 'insert', 'set', 'create', 'drop', 'replace', 'start transaction', 'commit'
  );

  /**
   * @return bool|PDO
   */
  protected function _connect()
  {
    try {
      $dsn = 'mysql:dbname=' . $this->_config->dbname . ';host=' . $this->_config->host;
      if ($this->_config->port) {
        $dsn .= ';port='. $this->_config->port;
      }
      if ($this->_config->sock != null) {
        $dsn .= ';unix_socket=' . $this->_config->sock;
      }

      $link = new PDO($dsn, $this->_config->username, $this->_config->password);
      $link->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

      return $link;

    } catch (PDOException $e) {
      return false;
    }
  }

  /**
   * @inheritdoc
   */
  protected function _afterConnect($handle)
  {
  }

  /**
   * @inheritdoc
   */
  public function localQuery($sql)
  {
    $result = array();
    /**
     * @var PDO $databaseHandle
     */
    $databaseHandle = $this->_getDatabaseHandle();
    $sth = $databaseHandle->query($sql);

    foreach ($this->noResult as $statement) {
      if (!$sth || strpos(strtolower(trim($sql)), $statement) === 0) {
        return true;
      }
    }

    while (($row = $sth->fetch(PDO::FETCH_ASSOC)) != false) {
      $result[] = $row;
    }

    return $result;
  }

  /**
   * @inheritdoc
   */
  protected function _query($sql, $fetchType, $fetchFields = false)
  {
    $result = array(
      'result'        => null,
      'message'       => '',
      'fetchedFields' => array()
    );

    /**
     * @var PDO $databaseHandle
     */
    $databaseHandle = $this->_getDatabaseHandle();

    switch ($fetchType) {
      case 3:
        $databaseHandle->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_BOTH);
        break;
      case 2:
        $databaseHandle->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_NUM);
        break;
      case 1:
      default:
        $databaseHandle->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        break;
    }

    try {
      $res = $databaseHandle->query($sql);
      $this->_affectedRows = $res->rowCount();
      $this->_insertedId = $databaseHandle->lastInsertId();
    } catch (PDOException $e) {
      $result['message'] = $this->_errorMsg($e->getCode() . ', ' . $e->getMessage());
      return $result;
    }

    foreach ($this->noResult as $statement) {
      if (!$res || strpos(strtolower(trim($sql)), $statement) === 0) {
        $result['result'] = true;
        return $result;
      }
    }

    $rows = array();
    while (($row = $res->fetch()) !== false) {
      $rows[] = $row;
    }

    if ($fetchFields) {
      $fetchedFields = array();
      $columnCount = $res->columnCount();
      for ($column = 0; $column < $columnCount; $column++) {
        $fetchedFields[] = $res->getColumnMeta($column);
      }
      $result['fetchedFields'] = $fetchedFields;
    }

    $result['result'] = $rows;

    unset($res);
    return $result;
  }

  /**
   * @inheritdoc
   */
  protected function _closeHandle($handle)
  {
  }

  /**
   * @inheritdoc
   */
  protected function _dbSetNames($charset)
  {
    /**
     * @var PDO $dataBaseHandle
     */
    $dataBaseHandle = $this->_getDatabaseHandle();
    $dataBaseHandle->exec('SET NAMES ' . $dataBaseHandle->quote($charset));
    $dataBaseHandle->exec('SET CHARACTER SET ' . $dataBaseHandle->quote($charset));
    $dataBaseHandle->exec('SET CHARACTER_SET_CONNECTION = ' . $dataBaseHandle->quote($charset));
  }

}

class M1_Mysqli extends M1_DatabaseLink
{
  protected function _connect()
  {
    return @mysqli_connect(
      $this->_config->host,
      $this->_config->username,
      $this->_config->password,
      $this->_config->dbname,
      $this->_config->port ? $this->_config->port : null,
      $this->_config->sock
    );
  }

  /**
   * @param  mysqli $handle DB Handle
   * @return void
   */
  protected function _afterConnect($handle)
  {
    mysqli_select_db($handle, $this->_config->dbname);
  }

  /**
   * @inheritdoc
   */
  public function localQuery($sql)
  {
    $result = array();
    /**
     * @var mysqli $databaseHandle
     */
    $databaseHandle = $this->_getDatabaseHandle();    
    $sth = mysqli_query($databaseHandle, $sql);
    if (is_bool($sth)) {
      return $sth;
    }
    while (($row = mysqli_fetch_assoc($sth))) {
      $result[] = $row;
    }
    return $result;
  }

  /**
   * @inheritdoc
   */
  protected function _query($sql, $fetchType, $fetchFields = false)
  {
    $result = array(
      'result'        => null,
      'message'       => '',
      'fetchedFields' => ''
    );

    $fetchMode = MYSQLI_ASSOC;
    switch ($fetchType) {
      case 3:
        $fetchMode = MYSQLI_BOTH;
        break;
      case 2:
        $fetchMode = MYSQLI_NUM;
        break;
      case 1:
        $fetchMode = MYSQLI_ASSOC;
        break;
      default:
        break;
    }

    /**
     * @var mysqli $databaseHandle
     */
    $databaseHandle = $this->_getDatabaseHandle();

    $res = mysqli_query($databaseHandle, $sql);

    $triesCount = 10;
    while (mysqli_errno($databaseHandle) == 2013) {
      if (!$triesCount--) {
        break;
      }
      // reconnect
      $this->_releaseHandle();
      if (isset($_REQUEST['set_names'])) {
        mysqli_set_charset($databaseHandle, $_REQUEST['set_names']);
      }

      // execute query once again
      $res = mysqli_query($databaseHandle, $sql);
    }

    if (($errno = mysqli_errno($databaseHandle)) != 0) {
      $result['message'] = $this->_errorMsg($errno . ', ' . mysqli_error($databaseHandle));
      return $result;
    }

    $this->_affectedRows = mysqli_affected_rows($databaseHandle);
    $this->_insertedId = mysqli_insert_id($databaseHandle);

    if (is_bool($res)) {
      $result['result'] = $res;
      return $result;
    }

    if ($fetchFields) {
      $result['fetchedFields'] = mysqli_fetch_fields($res);
    }


    $rows = array();
    while ($row = mysqli_fetch_array($res, $fetchMode)) {
      $rows[] = $row;
    }
 
    $result['result'] = $rows;

    mysqli_free_result($res);

    return $result;
  }

  /**
   * @inheritdoc
   */
  protected function _dbSetNames($charset)
  {
    /**
     * @var mysqli $databaseHandle
     */
    $databaseHandle = $this->_getDatabaseHandle();
    mysqli_set_charset($databaseHandle, $charset);
  }

  /**
   * @param  mysqli $handle DB Handle
   * @return void
   */
  protected function _closeHandle($handle)
  {
    mysqli_close($handle);
  }

}


class M1_Mysql extends M1_DatabaseLink
{
  
  /**
   * @inheritdoc
   */
  protected function _connect()
  {
    if ($this->_config->sock !== null) {
      $host = $this->_config->host . ':' . $this->_config->sock;
    } else {
      $host = $this->_config->host . ($this->_config->port ? ':' . $this->_config->port : '');
    }
    $password = stripslashes($this->_config->password);
    $link = @mysql_connect($host, $this->_config->username, $password);
    return $link;
  }

  /**
   * @inheritdoc
   */
  protected function _afterConnect($handle)
  {
    mysql_select_db($this->_config->dbname, $handle);
  }

  /**
   * @inheritdoc
   */
  public function localQuery($sql)
  {
    $result = array();
    $sth = mysql_query($sql, $this->_getDatabaseHandle());
    if (is_bool($sth)) {
      return $sth;
    }
    while (($row = mysql_fetch_assoc($sth)) != false) {
      $result[] = $row;
    }
    return $result;
  }

  /**
   * @inheritdoc
   */
  protected function _query($sql, $fetchType, $fetchFields = false)
  {
    $result = array(
      'result'  => null,
      'message' => '',
    );

    $fetchMode = MYSQL_ASSOC;
    switch ($fetchType) {
      case 3:
        $fetchMode = MYSQL_BOTH;
        break;
      case 2:
        $fetchMode = MYSQL_NUM;
        break;
      case 1:
        $fetchMode = MYSQL_ASSOC;
        break;
      default:
        break;
    }

    /**
     * @var resource $databaseHandle
     */
    $databaseHandle = $this->_getDatabaseHandle();

    $res = mysql_query($sql, $databaseHandle);

    $triesCount = 10;
    while (mysql_errno($databaseHandle) == 2013) {
      if (!$triesCount--) {
        break;
      }
      // reconnect
      $this->_releaseHandle();

      if (isset($_REQUEST['set_names'])) {
        mysql_set_charset($_REQUEST['set_names'], $databaseHandle);
      }
      // execute query once again
      $res = mysql_query($sql, $databaseHandle);
    }

    if (($errno = mysql_errno($databaseHandle)) != 0) {
      $result['message'] = '[ERROR] Mysql Query Error: ' . $errno . ', ' . mysql_error($databaseHandle);
      return $result;
    }

    $this->_affectedRows = mysql_affected_rows($databaseHandle);
    $this->_insertedId = mysql_insert_id($databaseHandle);

    if (!is_resource($res)) {
      $result['result'] = $res;
      return $result;
    }

    if ($fetchFields) {
      $fetchedFields = array();
      while (($field = mysql_fetch_field($res)) !== false) {
        $fetchedFields[] = $field;
      }
      $result['fetchedFields'] = $fetchedFields;
    }

    $rows = array();
    while (($row = mysql_fetch_array($res, $fetchMode)) !== false) {
      $rows[] = $row;
    }

    $result['result'] = $rows;
    mysql_free_result($res);
    return $result;
  }

  /**
   * @inheritdoc
   */
  protected function _closeHandle($handle)
  {
    mysql_close($handle);
  }

  /**
   * @inheritdoc
   */
  protected function _dbSetNames($charset)
  {
    mysql_set_charset($charset, $this->_getDatabaseHandle());
  }

}


class M1_Config_Adapter implements M1_Platform_Actions
{
  public $host                = 'localhost';
  public $port                = null;//"3306";
  public $sock                = null;
  public $username            = 'root';
  public $password            = '';
  public $dbname              = '';
  public $tblPrefix           = '';
  public $timeZone            = null;

  public $cartType                 = 'Oscommerce22ms2';
  public $cartId                   = '';
  public $imagesDir                = '';
  public $categoriesImagesDir      = '';
  public $productsImagesDir        = '';
  public $manufacturersImagesDir   = '';
  public $categoriesImagesDirs     = '';
  public $productsImagesDirs       = '';
  public $manufacturersImagesDirs  = '';

  public $languages   = array();
  public $cartVars    = array();

  /**
   * @return mixed
   */
  public function create()
  {
    $cartType = $this->_detectCartType();
    $className = "M1_Config_Adapter_" . $cartType;

    $obj = new $className();
    $obj->cartType = $cartType;

    return $obj;
  }

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function productAddAction($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function productUpdateAction($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function productAddBatchAction($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function productUpdateBatchAction($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   *
   * @return mixed
   */
  public function getPaymentMethods()
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function sendEmailNotifications($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function triggerAsOrderShipment($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function triggerEvents($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function triggerEventsBatch($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @return mixed
   */
  public function getPlugins()
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @return mixed
   */
  public function sendReturnEmails($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @inheritDoc
   */
  public function setMetaData($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @inheritDoc
   */
  public function getTranslations($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @inheritDoc
   */
  public function getWdrPrice($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @inheritDoc
   */
  public function setOrderNotes($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @inheritDoc
   */
  public function getActiveModules($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @inheritDoc
   */
  public function getImagesUrls($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @inheritDoc
   */
  public function imageAdd($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @inheritDoc
   */
  public function orderUpdate($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @inheritDoc
   */
  public function categoryAdd($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @inheritDoc
   */
  public function categoryUpdate($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @inheritDoc
   */
  public function categoryDelete($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @inheritDoc
   */
  public function cleanCache($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @return mixed
   */
  public function createLiveShippingService($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @return mixed
   */
  public function deleteLiveShippingService($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * Get Card ID string from request parameters
   * @return string
   */
  protected function _getRequestCartId()
  {
    return isset($_POST['cart_id']) ? $_POST['cart_id'] : '';
  }

  /**
   *
   * @return mixed
   */
  public function productDeleteAction($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @inheritDoc
   */
  public function orderCalculate($a2cData)
  {
    return array('error' => 'Action is not supported', 'data' => false);
  }

  /**
   * @return string
   */
  private function _detectCartType()
  {
    switch ($this->_getRequestCartId()) {
      default :
      case 'Prestashop':
        if (file_exists(M1_STORE_BASE_DIR . "config/config.inc.php")) {
          return "Prestashop";
        }
      case 'Ubercart':
        if (file_exists(M1_STORE_BASE_DIR . 'sites/default/settings.php')) {
          if (file_exists(M1_STORE_BASE_DIR . '/modules/ubercart/uc_store/includes/coder_review_uc3x.inc') ||
            file_exists(M1_STORE_BASE_DIR . '/sites/all/modules/ubercart/uc_store/includes/coder_review_uc3x.inc')) {
            return "Ubercart3";
          } elseif (file_exists(
            M1_STORE_BASE_DIR
            . 'sites/all/modules/commerce/includes/commerce.controller.inc'
          )) {
            return "DrupalCommerce";
          }
          return "Ubercart";
        }
      case 'Woocommerce':
      case 'WPecommerce':
        if (file_exists(M1_STORE_BASE_DIR . 'wp-config.php') || file_exists(M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR . 'wp-config.php')) {
          return 'Wordpress';
        }
      case 'Zencart137':
        if (file_exists(
            M1_STORE_BASE_DIR . "includes" . DIRECTORY_SEPARATOR
            . "configure.php"
          )
          && file_exists(M1_STORE_BASE_DIR . "ipn_main_handler.php")
        ) {
          return "Zencart137";
        }
      case 'Oscommerce22ms2':
        if (file_exists(
            M1_STORE_BASE_DIR . "includes" . DIRECTORY_SEPARATOR
            . "configure.php"
          )
          && !file_exists(
            M1_STORE_BASE_DIR . "includes" . DIRECTORY_SEPARATOR
            . "toc_constants.php"
          )
        ) {
          return "Oscommerce22ms2";
        }
      case 'Gambio':
        if (file_exists(M1_STORE_BASE_DIR . "/includes/configure.php")) {
          return "Gambio";
        }
      case 'JooCart':
        if (file_exists(
          M1_STORE_BASE_DIR . '/components/com_opencart/opencart.php'
        )) {
          return 'JooCart';
        }
      case 'Mijoshop':
        if (file_exists(
          M1_STORE_BASE_DIR . '/components/com_mijoshop/mijoshop.php'
        )) {
          return 'Mijoshop';
        }
      case 'AceShop':
        if (file_exists(
          M1_STORE_BASE_DIR . '/components/com_aceshop/aceshop.php'
        )) {
          return 'AceShop';
        }
      case 'Oxid':
        if (file_exists(M1_STORE_BASE_DIR . 'config.inc.php')) {
          return 'Oxid';
        }
      case 'Virtuemart113':
        if (file_exists(M1_STORE_BASE_DIR . "configuration.php")) {
          return "Virtuemart113";
        }
      case 'Pinnacle361':
        if (file_exists(
          M1_STORE_BASE_DIR . 'content/engine/engine_config.php'
        )) {
          return "Pinnacle361";
        }
      case 'Zoey':
        if (file_exists(M1_STORE_BASE_DIR . 'lib/Zoey/Redis/Overlord.php')) {
          return 'Zoey';
        }
      case 'Magento1212':
        if (file_exists(M1_STORE_BASE_DIR . 'app/etc/local.xml')
          || file_exists(M1_STORE_BASE_DIR . 'app/etc/env.php')
          || file_exists(M1_STORE_BASE_DIR . '/../app/etc/env.php')//if pub is a document root
        ) {
          return "Magento1212";
        }
      case 'Cubecart':
        if (file_exists(M1_STORE_BASE_DIR . 'includes/global.inc.php')) {
          return "Cubecart";
        }
      case 'Cscart203':
        if (file_exists(M1_STORE_BASE_DIR . "config.local.php")
          || file_exists(M1_STORE_BASE_DIR . "prepare.php") && file_exists(M1_STORE_BASE_DIR . "init.php")
        ) {
          return "Cscart203";
        }
      case 'Opencart14':
        if ((file_exists(M1_STORE_BASE_DIR . "system/startup.php")
            || (file_exists(M1_STORE_BASE_DIR . "common.php"))
            || (file_exists(M1_STORE_BASE_DIR . "library/locator.php"))
          )
          && file_exists(M1_STORE_BASE_DIR . "config.php")
        ) {
          return "Opencart14";
        }
      case 'Shopware':
        if (file_exists(M1_STORE_BASE_DIR . "config.php") && file_exists(M1_STORE_BASE_DIR . "shopware.php")
            || file_exists(M1_STORE_BASE_DIR . '.env')
            || file_exists(M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR . '.env')
        ) {
          return "Shopware";
        }
      case 'LemonStand':
        if (file_exists(M1_STORE_BASE_DIR . "boot.php")) {
          return "LemonStand";
        }
      case 'WebAsyst':
        if (file_exists(M1_STORE_BASE_DIR . 'kernel/wbs.xml')) {
          return "WebAsyst";
        }
      case 'SSPremium':
        //Shopscript Premium
        if (file_exists(M1_STORE_BASE_DIR . 'cfg/connect.inc.php')) {
          return "SSPremium";
        }

        //ShopScript5
        if (file_exists(M1_STORE_BASE_DIR . 'wa.php')
          && file_exists(
            M1_STORE_BASE_DIR . 'wa-config/db.php'
          )
        ) {
          return "SSPremium";
        }
      case 'XtcommerceVeyton':
      case 'Xtcommerce':
      if (file_exists(M1_STORE_BASE_DIR . 'conf/config.php')) {
          return "XtcommerceVeyton";
        }
      case 'XCart':
        if (file_exists(M1_STORE_BASE_DIR . 'config.php')
          || (file_exists(M1_STORE_BASE_DIR . '/etc/config.php'))
        ) {
          return "XCart";
        }
      case 'Tomatocart':
        if (file_exists(
            M1_STORE_BASE_DIR . "includes" . DIRECTORY_SEPARATOR
            . "configure.php"
          )
          && file_exists(
            M1_STORE_BASE_DIR . "includes" . DIRECTORY_SEPARATOR
            . "toc_constants.php"
          )
        ) {
          return 'Tomatocart';
        }
    }
    die ("BRIDGE_ERROR_CONFIGURATION_NOT_FOUND");
  }

  /**
   * @param $cartType
   * @return string
   */
  public function getAdapterPath($cartType)
  {
    return M1_STORE_BASE_DIR . M1_BRIDGE_DIRECTORY_NAME . DIRECTORY_SEPARATOR
      . "app" . DIRECTORY_SEPARATOR
      . "class" . DIRECTORY_SEPARATOR
      . "config_adapter" . DIRECTORY_SEPARATOR . $cartType . ".php";
  }

  /**
   * @param $source
   */
  public function setHostPort($source)
  {
    $source = trim($source);

    if ($source == '') {
      $this->host = 'localhost';
      return;
    }

    if (strpos($source, '.sock') !== false) {
      $socket = ltrim($source, 'localhost:');
      $socket = ltrim($socket, '127.0.0.1:');

      $this->host = 'localhost';
      $this->sock = $socket;

      return;
    }

    $conf = explode(":", $source);

    if (isset($conf[0]) && isset($conf[1]) && isset($conf[2])) {
      $this->host = $conf[0] . ':' . $conf[1];
      $this->port = $conf[2];
    } elseif (isset($conf[0]) && isset($conf[1])) {
      $this->host = $conf[0];
      $this->port = $conf[1];
    } elseif ($source[0] == '/') {
      $this->host = 'localhost';
      $this->port = $source;
    } else {
      $this->host = $source;
    }
  }

  /**
   * @param Exception|Throwable $e         Exception or Throwable
   * @param array|null          $response  Response
   * @param int|string|null     $errorCode Error code
   *
   * @return array
   */
  protected function _getBridgeError($e, $response = null, $errorCode = null)
  {
    if (is_array($response)) {
      return M1_Bridge::getBridgeError($e, $response, $errorCode, 'error', 'error_code', __FILE__);
    }

    return M1_Bridge::getBridgeError($e, null, $errorCode, 'message', 'error_code', __FILE__);
  }

  /**
   * @return bool|M1_Mysql|M1_Mysqli|M1_Pdo
   */
  public function connect()
  {
    if (extension_loaded('pdo_mysql')) {
      $link = new M1_Pdo($this);
    } elseif (function_exists('mysqli_connect')) {
      $link = new M1_Mysqli($this);
    } elseif (function_exists('mysql_connect')) {
      $link = new M1_Mysql($this);
    } else {
      $link = false;
    }

    return $link;
  }

  /**
   * @param $field
   * @param $tableName
   * @param $where
   * @return string
   */
  public function getCartVersionFromDb($field, $tableName, $where)
  {
    $version = '';

    $link = $this->connect();
    if (!$link) {
      return '[ERROR] MySQL Query Error: Can not connect to DB';
    }

    $result = $link->localQuery("
      SELECT " . $field . " AS version
      FROM " . $this->tblPrefix . $tableName . "
      WHERE " . $where
    );

    if (is_array($result) && isset($result[0]['version'])) {
      $version = $result[0]['version'];
    }

    return $version;
  }
}

class M1_Bridge
{
  /**
   * @var M1_DatabaseLink|null
   */
  protected $_link  = null; //mysql connection link
  public $config    = null; //config adapter

  /**
   * Bridge constructor
   *
   * M1_Bridge constructor.
   * @param $config
   */
  public function __construct(M1_Config_Adapter $config)
  {
    $this->config = $config;

    if ($this->getAction() != "savefile") {
      $this->_link = $this->config->connect();
    }
  }

  /**
   * @return mixed
   */
  public function getTablesPrefix()
  {
    return $this->config->tblPrefix;
  }

  /**
   * @return M1_DatabaseLink|null
   */
  public function getLink()
  {
    return $this->_link;
  }

  /**
   * @return mixed|string
   */
  private function getAction()
  {
    if (isset($_POST['action'])) {
      return str_replace('.', '', $_POST['action']);
    }

    return '';
  }

  /**
   * @param Exception|Throwable $e         Exception or Throwable
   * @param array|null          $response  Response
   * @param int|string|null     $errorCode Error code
   * @param string              $messageKey Error message key
   * @param string              $codeKey Error code key
   *
   * @return array
   */
  public static function getBridgeError($e, $response = null, $errorCode = null, $messageKey = 'message', $codeKey = 'error_code', $bridgeFile = null)
  {
    $errorMessage = self::getBridgeErrorMessage($e, $bridgeFile);
    $errorCode = $errorCode === null ? $e->getCode() : $errorCode;

    if (is_array($response)) {
      $response[$messageKey] = $errorMessage;
      $response[$codeKey] = $errorCode;

      return $response;
    }

    return array(
      $messageKey => $errorMessage,
      $codeKey => $errorCode,
    );
  }

  /**
   * @param Exception|Throwable $e Exception or Throwable
   *
   * @return string
   */
  public static function getBridgeErrorMessage($e, $bridgeFile = null)
  {
    $message = trim($e->getMessage());

    if ($message === '') {
      $message = get_class($e);
    }

    $bridgeTrace = self::_getBridgeTrace($e, $bridgeFile);

    if (!$bridgeTrace) {
      return $message;
    }

    $firstTraceLine = array_shift($bridgeTrace) . ': ' . $message;

    if (!$bridgeTrace) {
      return $firstTraceLine;
    }

    return $firstTraceLine . "\n" . implode("\n", $bridgeTrace);
  }

  /**
   * @param Exception|Throwable $e Exception or Throwable
   *
   * @return array
   */
  protected static function _getBridgeTrace($e, $bridgeFile = null)
  {
    if ($bridgeFile === null) {
      $bridgeFile = __FILE__;
    }

    $bridgeFile = str_replace('\\', '/', $bridgeFile);
    $trace = array();
    $frames = array_merge(
      array(
        array(
          'file' => $e->getFile(),
          'line' => $e->getLine(),
        ),
      ),
      $e->getTrace()
    );

    foreach ($frames as $traceItem) {
      if (empty($traceItem['file'])) {
        continue;
      }

      $traceFile = str_replace('\\', '/', $traceItem['file']);

      if ($traceFile !== $bridgeFile) {
        continue;
      }

      $line = isset($traceItem['line']) ? (int)$traceItem['line'] : 0;
      $formattedTraceItem = basename($traceItem['file']) . '(' . $line . ')';
      $method = '';

      if (!empty($traceItem['class'])) {
        $method .= $traceItem['class'];
      }

      if (!empty($traceItem['function'])) {
        if ($method !== '') {
          if (!empty($traceItem['type'])) {
            $method .= $traceItem['type'];
          } else {
            $method .= '::';
          }
        }

        $method .= $traceItem['function'] . '()';
      }

      if ($method !== '') {
        $formattedTraceItem .= ': ' . $method;
      }

      if (!in_array($formattedTraceItem, $trace, true)) {
        $trace[] = $formattedTraceItem;
      }
    }

    return $trace;
  }

  public function run()
  {
    $action = $this->getAction();

    if ($action == "checkbridge") {
      if (defined('M1_BRIDGE_PUBLIC_KEY') && defined('M1_BRIDGE_PUBLIC_KEY_ID') && defined('M1_BRIDGE_ENABLE_ENCRYPTION') && M1_BRIDGE_ENABLE_ENCRYPTION == 1) {
        echo json_encode(['message' => 'BRIDGE_OK', 'key_id' => M1_BRIDGE_PUBLIC_KEY_ID, 'bridge_version' => M1_BRIDGE_VERSION]);
      } else {
        echo "BRIDGE_OK";
      }

      return;
    }

    $this->validateSign();

    if ($action == "update") {
      $this->_checkPossibilityUpdate();
    }

    $className = "M1_Bridge_Action_" . ucfirst($action);
    if (!class_exists($className)) {
      echo 'ACTION_DO_NOT EXIST' . PHP_EOL;
      die;
    }

    $actionObj = new $className();
    @$actionObj->cartType = @$this->config->cartType;
    $actionObj->perform($this);
    $this->_destroy();
  }

  private function validateSign()
  {
    if (isset($_GET['token'])) {
      exit('ERROR: Field token is not correct');
    }

    if (empty($_POST)) {
      exit('BRIDGE INSTALLED.<br /> Version: ' . M1_BRIDGE_VERSION);
    }

    if (isset($_POST['a2c_sign'])) {
      $sign = $_POST['a2c_sign'];
    } else {
      exit('ERROR: Signature is not correct');
    }

    unset($_POST['a2c_sign']);
    ksort($_POST, SORT_STRING);
    $resSign = hash_hmac('sha256', http_build_query($_POST), M1_TOKEN);

    if ($sign !== $resSign) {
      exit('ERROR: Signature is not correct');
    }

    show_error(1);
  }

  /**
   * @param $dir
   * @return bool
   */
  private function isWritable($dir)
  {
    if (!@is_dir($dir)) {
      return false;
    }

    $dh = @opendir($dir);

    if ($dh === false) {
      return false;
    }

    while (($entry = readdir($dh)) !== false) {
      if ($entry == "." || $entry == ".." || !@is_dir($dir . DIRECTORY_SEPARATOR . $entry)) {
        continue;
      }

      if (!$this->isWritable($dir . DIRECTORY_SEPARATOR . $entry)) {
        return false;
      }
    }

    if (!is_writable($dir)) {
      return false;
    }

    return true;
  }

  private function _destroy()
  {
    $this->_link = null;
  }

  private function _checkPossibilityUpdate()
  {
    if (!is_writable(__DIR__)) {
      die("ERROR_BRIDGE_DIR_IS_NOT_WRITABLE");
    }

    if (!is_writable(__FILE__)) {
      die("ERROR_BRIDGE_IS_NOT_WRITABLE");
    }
  }

  private function _selfTest()
  {
    if (isset($_GET['token'])) {
      if ($_GET['token'] === M1_TOKEN) {
        // good :)
      } else {
        die('ERROR_INVALID_TOKEN');
      }
    } else{
      die('BRIDGE INSTALLED.<br /> Version: ' . M1_BRIDGE_VERSION);
    }
  }

  /**
   * Remove php comments from string
   * @param string $str
   */
  public static function removeComments($str)
  {
    $result  = '';
    $commentTokens = array(T_COMMENT, T_DOC_COMMENT);
    $tokens = token_get_all($str);

    foreach ($tokens as $token) {
      if (is_array($token)) {
        if (in_array($token[0], $commentTokens))
          continue;
        $token = $token[1];
      }
      $result .= $token;
    }

    return $result;
  }

  /**
   * @param $str
   * @param string $constNames
   * @param bool $onlyString
   * @return array
   */
  public static function parseDefinedConstants($str, $constNames = '\w+', $onlyString = true )
  {
    $res = array();
    $pattern = '/define\s*\(\s*[\'"](' . $constNames . ')[\'"]\s*,\s*'
      . ($onlyString ? '[\'"]' : '') . '(.*?)' . ($onlyString ? '[\'"]' : '') . '\s*\)\s*;/';

    preg_match_all($pattern, $str, $matches);

    if (isset($matches[1]) && isset($matches[2])) {
      foreach ($matches[1] as $key => $constName) {
        $res[$constName] = $matches[2][$key];
      }
    }

    return $res;
  }

}


/**
 * Class M1_Config_Adapter_Zoey
 */
class M1_Config_Adapter_Zoey extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_Zoey constructor.
   */
  public function __construct()
  {
    /**
     * @var SimpleXMLElement
     */
    $config = simplexml_load_file(M1_STORE_BASE_DIR . 'app/etc/local.xml');

    $this->cartVars['dbPrefix'] = (string)$config->global->resources->db->table_prefix;
    $this->tblPrefix = (string)$config->global->resources->db->table_prefix;

    include_once M1_STORE_BASE_DIR . 'app/Mage.php';
    $this->cartVars['dbVersion'] = Mage::getVersion();

    if (Zoey_Redis_Overlord::isEnabled()) {
      $storeRedis = Zoey_Redis_Overlord::getStoreCache();
      $config = $storeRedis->setDatabaseConnectionVars($config);

      $this->setHostPort((string)$config->host);
      $this->password  = (string)$config->password;
      $this->username  = (string)$config->username;
      $this->dbname    = (string)$config->dbname;
    } else {
      $this->setHostPort((string)$config->global->resources->default_setup->connection->host);
      $this->username  = (string)$config->global->resources->default_setup->connection->username;
      $this->dbname    = (string)$config->global->resources->default_setup->connection->dbname;
      $this->password  = (string)$config->global->resources->default_setup->connection->password;
    }

    $this->imagesDir              = 'media/';
    $this->categoriesImagesDir    = $this->imagesDir . 'catalog/category/';
    $this->productsImagesDir      = $this->imagesDir . 'catalog/product/';
    $this->manufacturersImagesDir = $this->imagesDir;
  }
}

/**
 * Class M1_Config_Adapter_Zencart137
 */
class M1_Config_Adapter_Zencart137 extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_Zencart137 constructor.
   */
  public function __construct()
  {
    $curDir = getcwd();

    chdir(M1_STORE_BASE_DIR);

    @require_once M1_STORE_BASE_DIR . "includes" . DIRECTORY_SEPARATOR . "configure.php";
    if (file_exists(M1_STORE_BASE_DIR  . "includes" . DIRECTORY_SEPARATOR . 'defined_paths.php')) {
      @require_once M1_STORE_BASE_DIR . "includes" . DIRECTORY_SEPARATOR . "defined_paths.php";
    }

    chdir($curDir);

    $this->imagesDir = DIR_WS_IMAGES;

    $this->categoriesImagesDir    = $this->imagesDir;
    $this->productsImagesDir      = $this->imagesDir;
    if (defined('DIR_WS_PRODUCT_IMAGES')) {
      $this->productsImagesDir = DIR_WS_PRODUCT_IMAGES;
    }
    if (defined('DIR_WS_ORIGINAL_IMAGES')) {
      $this->productsImagesDir = DIR_WS_ORIGINAL_IMAGES;
    }
    $this->manufacturersImagesDir = $this->imagesDir;

    $this->setHostPort(DB_SERVER);
    $this->username  = DB_SERVER_USERNAME;
    $this->password  = DB_SERVER_PASSWORD;
    $this->dbname    = DB_DATABASE;

    if (defined('DB_PREFIX')) {
      $this->tblPrefix = DB_PREFIX;
    } else {
      $this->tblPrefix = '';
    }

    if (file_exists(M1_STORE_BASE_DIR  . "includes" . DIRECTORY_SEPARATOR . 'version.php')) {
       @require_once M1_STORE_BASE_DIR
              . "includes" . DIRECTORY_SEPARATOR
              . "version.php";
      $major = PROJECT_VERSION_MAJOR;
      $minor = PROJECT_VERSION_MINOR;
      if (defined('EXPECTED_DATABASE_VERSION_MAJOR') && EXPECTED_DATABASE_VERSION_MAJOR != '' ) {
        $major = EXPECTED_DATABASE_VERSION_MAJOR;
      }
      if (defined('EXPECTED_DATABASE_VERSION_MINOR') && EXPECTED_DATABASE_VERSION_MINOR != '' ) {
        $minor = EXPECTED_DATABASE_VERSION_MINOR;
      }

      if ($major != '' && $minor != '') {
        $this->cartVars['dbVersion'] = $major.'.'.$minor;
      }

    }
  }

}



/**
 * Class M1_Config_Adapter_XtcommerceVeyton
 */
class M1_Config_Adapter_XtcommerceVeyton extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_XtcommerceVeyton constructor.
   */
  public function __construct()
  {
    define('_VALID_CALL','TRUE');
    define('_SRV_WEBROOT','TRUE');
    require_once M1_STORE_BASE_DIR
      . 'conf'
      . DIRECTORY_SEPARATOR
      . 'config.php';

    require_once M1_STORE_BASE_DIR
      . 'conf'
      . DIRECTORY_SEPARATOR
      . 'paths.php';

    $this->setHostPort(_SYSTEM_DATABASE_HOST);
    $this->dbname = _SYSTEM_DATABASE_DATABASE;
    $this->username = _SYSTEM_DATABASE_USER;
    $this->password = _SYSTEM_DATABASE_PWD;
    $this->imagesDir = _SRV_WEB_IMAGES;
    $this->tblPrefix = DB_PREFIX . "_";

    try {
      $timeZone = date_default_timezone_get();
    } catch (Exception $e) {
      $timeZone = 'UTC';
    }

    $this->timeZone = $timeZone;
    $version = $this->getCartVersionFromDb("config_value", "config", "config_key = '_SYSTEM_VERSION'");
    if ($version != '') {
      $this->cartVars['dbVersion'] = $version;
    } elseif (M1_STORE_BASE_DIR . 'versioninfo.php') {
      $file = file_get_contents(M1_STORE_BASE_DIR . 'versioninfo.php');

      if (strpos($file, 'File is part of xt:Commerce') !== false) {
        $start = strpos($file, 'File is part of xt:Commerce');
        $version = trim(substr($file, $start + 27, 8));
      } elseif (strpos($file, "_SYSTEM_VERSION','") !== false) {
        $version = trim(substr($file, strpos($file, "_SYSTEM_VERSION','") + 18, 5));
      } else {
        $version = '';
      }

      $this->cartVars['dbVersion'] = $version;
    }

    $this->categoriesImagesDir    = $this->imagesDir;
    $this->productsImagesDir      = $this->imagesDir;
    $this->manufacturersImagesDir = $this->imagesDir;
  }
}


/**
 * Class M1_Config_Adapter_XCart
 */
class M1_Config_Adapter_XCart extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_XCart constructor.
   */
  public function __construct()
  {
    define('XCART_START', 1);

    if (file_exists(M1_STORE_BASE_DIR . "config.php")) {
      $this->_xcart();
    } else {
      $this->_xcart5();
    }
  }

  /**
   * @return void
   */
  protected function _xcart()
  {
    $config = file_get_contents(M1_STORE_BASE_DIR . "config.php");

    try {
      preg_match('/\$sql_host.+\'(.+)\';/', $config, $match);
      $this->setHostPort($match[1]);
      preg_match('/\$sql_user.+\'(.+)\';/', $config, $match);
      $this->username = $match[1];
      preg_match('/\$sql_db.+\'(.+)\';/', $config, $match);
      $this->dbname = $match[1];
      preg_match('/\$sql_password.+\'(.*)\';/', $config, $match);
      $this->password = $match[1];
    } catch (Exception $e) {
      die('ERROR_READING_STORE_CONFIG_FILE');
    }

    $this->imagesDir = 'images/'; // xcart starting from 4.1.x hardcodes images location
    $this->categoriesImagesDir    = $this->imagesDir;
    $this->productsImagesDir      = $this->imagesDir;
    $this->manufacturersImagesDir = $this->imagesDir;

    if (file_exists(M1_STORE_BASE_DIR . "VERSION")) {
      $version = file_get_contents(M1_STORE_BASE_DIR . "VERSION");
      $this->cartVars['dbVersion'] = preg_replace('/(Version| |\\n)/', '', $version);
    }
  }

  /**
   * @return void
   */
  protected function _xcart5()
  {
    $config = M1_STORE_BASE_DIR .'/etc/config.php';
    $this->imagesDir = "/images";
    $this->categoriesImagesDir    = $this->imagesDir."/category";
    $this->productsImagesDir      = $this->imagesDir."/product";
    $this->manufacturersImagesDir = $this->imagesDir;

    $settings = parse_ini_file($config, true);
    $settings = $settings['database_details'];
    $this->host      = $settings['hostspec'];
    $this->setHostPort($settings['hostspec']);
    $this->username  = $settings['username'];
    $this->password  = $settings['password'];
    $this->dbname    = $settings['database'];
    $this->tblPrefix = $settings['table_prefix'];

    $version = $this->getCartVersionFromDb("value", "config", "name = 'version'");
    if ($version != '') {
      $this->cartVars['dbVersion'] = $version;
    }
  }
}

/**
 * Class M1_Config_Adapter_Wordpress
 */
class M1_Config_Adapter_Wordpress extends M1_Config_Adapter
{

  const ERROR_CODE_SUCCESS = 0;
  const ERROR_CODE_ENTITY_NOT_FOUND = 1;
  const ERROR_CODE_INTERNAL_ERROR = 2;

  private $_multiSiteEnabled = false;
  private $_pluginName = '';
  private $_wpmlEnabled = false;
  private $_polylangEnabled = false;

  /**
   * M1_Config_Adapter_Wordpress constructor.
   */
  public function __construct()
  {
    if (file_exists(M1_STORE_BASE_DIR . 'wp-config.php')) {
      $config = file_get_contents(M1_STORE_BASE_DIR . 'wp-config.php');
    } elseif (file_exists(realpath(M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR . 'wp-config.php'))) {
      $config = file_get_contents(realpath(M1_STORE_BASE_DIR . '../wp-config.php'));
    }

    if (isset($config)) {
      $configs =  M1_Bridge::removeComments($config);
      $constants = M1_Bridge::parseDefinedConstants($configs, 'DB_NAME|DB_USER|DB_PASSWORD|DB_HOST|UPLOADS|WP_HOME|WP_SITEURL|WP_CONTENT_URL');
      preg_match('/\$table_prefix\s*=\s*[\'"](.+?)[\'"]\s*;/', $configs, $tblPrefixMatch);

      if (!isset($constants['DB_NAME'], $constants['DB_USER'], $constants['DB_PASSWORD'], $constants['DB_HOST'], $tblPrefixMatch[1]) || $this->hasUrlProgrammed($constants)) {
        $this->_tryLoadConfigs($tblPrefixMatch[1]);
      } else {
        $multiSiteSettings = M1_Bridge::parseDefinedConstants($configs, 'MULTISITE', false);

        $this->_multiSiteEnabled = isset($multiSiteSettings['MULTISITE']) && $multiSiteSettings['MULTISITE'] === 'true';
        $this->dbname   = $constants['DB_NAME'];
        $this->username = $constants['DB_USER'];
        $this->password = $constants['DB_PASSWORD'];
        $this->setHostPort($constants['DB_HOST']);
        $this->tblPrefix = $tblPrefixMatch[1];

        if (isset($constants['UPLOADS'])) {
          $this->imagesDir = preg_replace('/\'\.\'/', '', $constants['UPLOADS']);
        } else {
          $this->imagesDir = 'wp-content' . DIRECTORY_SEPARATOR . 'uploads';
        }

        if (!$this->_multiSiteEnabled) {
          if (isset($constants['WP_HOME'])) {
            $this->cartVars['wp_home'] = $constants['WP_HOME'];
          }

          if (isset($constants['WP_SITEURL'])) {
            $this->cartVars['wp_siteurl'] = $constants['WP_SITEURL'];
          }

          if (isset($constants['WP_CONTENT_URL'])) {
            $this->cartVars['wp_content_url'] =  $constants['WP_CONTENT_URL'];
          }
        } elseif (isset($constants['WP_CONTENT_URL'])) {
          $this->cartVars['wp_content_url'] =  $constants['WP_CONTENT_URL'];
        }
      }

      $debugModeSettings = M1_Bridge::parseDefinedConstants($configs, 'WP_DEBUG', false);
      $this->cartVars['debugMode'] = isset($debugModeSettings['WP_DEBUG']) && strtolower($debugModeSettings['WP_DEBUG']) === 'true';
      $charsetSettings = M1_Bridge::parseDefinedConstants($configs, 'DB_CHARSET', true);
      $this->cartVars['dbCharset'] = isset($charsetSettings['DB_CHARSET']) ? $charsetSettings['DB_CHARSET'] : 'utf8';
    } else {
      $this->_tryLoadConfigs();
    }

    $getActivePlugin = function($cartPlugins) {
      foreach ($cartPlugins as $plugin) {
        if ($cartId = $this->_getRequestCartId()) {
          if ($cartId == 'Woocommerce' && strpos($plugin, 'woocommerce.php') !== false) {
            return 'woocommerce';
          } elseif ($cartId == 'WPecommerce' && (strpos($plugin, 'wp-e-commerce') === 0 || strpos($plugin, 'wp-ecommerce') === 0)) {
            return 'wp-e-commerce';
          }
        } else {
          if (strpos($plugin, 'woocommerce.php') !== false) {
            return 'woocommerce';
          } elseif (strpos($plugin, 'wp-e-commerce') === 0 || strpos($plugin, 'wp-ecommerce') === 0) {
            return 'wp-e-commerce';
          }
        }
      };

      return false;
    };

    $activePlugin = false;
    $wpTblPrefix = $this->tblPrefix;

    if ($this->_multiSiteEnabled) {
      $cartPluginsNetwork = $this->getCartVersionFromDb(
        "meta_value", "sitemeta", "meta_key = 'active_sitewide_plugins'"
      );

      if ($cartPluginsNetwork) {
        $cartPluginsNetwork = unserialize($cartPluginsNetwork);
        $activePlugin = $getActivePlugin(array_keys($cartPluginsNetwork));
      }

      if ($activePlugin === false) {
        if ($link = $this->connect()) {
          $blogs = $link->localQuery('SELECT blog_id FROM ' . $this->tblPrefix . 'blogs');
          if ($blogs) {
            foreach ($blogs as $blog) {
              if ($blog['blog_id'] > 1) {
                $this->tblPrefix = $this->tblPrefix . $blog['blog_id'] . '_';
              }

              $cartPlugins = $this->getCartVersionFromDb("option_value", "options", "option_name = 'active_plugins'");
              if ($cartPlugins) {
                $activePlugin = $getActivePlugin(unserialize($cartPlugins));
              }

              if ($activePlugin) {
                break;
              } else {
                $this->tblPrefix = $wpTblPrefix;
              }
            }
          }
        } else {
          return '[ERROR] MySQL Query Error: Can not connect to DB';
        }
      }
    } else {
      $cartPlugins = $this->getCartVersionFromDb("option_value", "options", "option_name = 'active_plugins'");
      if ($cartPlugins) {
        $activePlugin = $getActivePlugin(unserialize($cartPlugins));
      }
    }

    if ($activePlugin == 'woocommerce') {
      $this->_setWoocommerceData();
    } elseif($activePlugin == 'wp-e-commerce') {
      $this->_setWpecommerceData();
    } else {
      die ("CART_PLUGIN_IS_NOT_DETECTED");
    }

    $this->_pluginName = $activePlugin;
    $this->tblPrefix = $wpTblPrefix;

    if (isset($_POST['aelia_cs_currency'])) {
      unset($_POST['aelia_cs_currency']);
    }
  }

  protected function _setWoocommerceData()
  {
    $this->cartId = "Woocommerce";
    $version = $this->getCartVersionFromDb("option_value", "options", "option_name = 'woocommerce_db_version'");

    if ($version != '') {
      $this->cartVars['dbVersion'] = $version;
    }

    $this->cartVars['categoriesDirRelative'] = 'images/categories/';
    $this->cartVars['productsDirRelative'] = 'images/products/';
  }

  /**
   * @param array $constants Constants
   *
   * @return bool
   */
  protected function hasUrlProgrammed($constants)
  {
    $validHomeUrl = false;
    $validSiteUrl = false;

    if (isset($constants['WP_HOME'])) {
      $validHomeUrl = filter_var($constants['WP_HOME'], FILTER_VALIDATE_URL) !== false;
    } elseif (isset($constants['WP_SITEURL'])) {
      $validSiteUrl = filter_var($constants['WP_SITEURL'], FILTER_VALIDATE_URL) !== false;
    }

    return $validHomeUrl || $validSiteUrl;
  }

  /**
   * @return void
   */
  private function _resetGlobalVars()
  {
    foreach($GLOBALS as $varname => $value)
    {
      global $$varname; //$$ is no mistake here

      $$varname = $value;
    }
  }

  protected function _setWpecommerceData()
  {
    $this->cartId = "Wpecommerce";
    $version = $this->getCartVersionFromDb("option_value", "options", "option_name = 'wpsc_version'");
    if ($version != '') {
      $this->cartVars['dbVersion'] = $version;
    } else {
      $filePath = M1_STORE_BASE_DIR . "wp-content" . DIRECTORY_SEPARATOR . "plugins" . DIRECTORY_SEPARATOR
                  . "wp-shopping-cart" . DIRECTORY_SEPARATOR . "wp-shopping-cart.php";
      if (file_exists($filePath)) {
        $conf = file_get_contents ($filePath);
        preg_match("/define\('WPSC_VERSION.*/", $conf, $match);
        if (isset($match[0]) && !empty($match[0])) {
          preg_match("/\d.*/", $match[0], $project);
          if (isset($project[0]) && !empty($project[0])) {
            $version = $project[0];
            $version = str_replace(array(" ","-","_","'",");",")",";"), "", $version);
            if ($version != '') {
              $this->cartVars['dbVersion'] = strtolower($version);
            }
          }
        }
      }
    }

    if ( file_exists( WP_CONTENT_DIR. DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'shopp' . DIRECTORY_SEPARATOR . 'Shopp.php' )
         || file_exists( WP_CONTENT_DIR . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'wp-e-commerce' . DIRECTORY_SEPARATOR . 'editor.php' ) ) {
      $this->imagesDir              = wp_upload_dir( null, false )['basedir'] . DIRECTORY_SEPARATOR . 'wpsc' . DIRECTORY_SEPARATOR;
      $this->categoriesImagesDir    = $this->imagesDir . 'category_images' . DIRECTORY_SEPARATOR;
      $this->productsImagesDir      = $this->imagesDir . 'product_images' . DIRECTORY_SEPARATOR;
      $this->manufacturersImagesDir = $this->imagesDir;
    } elseif ( file_exists( WP_CONTENT_DIR . DIRECTORY_SEPARATOR . 'plugins' . DIRECTORY_SEPARATOR . 'wp-e-commerce' . DIRECTORY_SEPARATOR . 'wp-shopping-cart.php' ) ) {
      $this->imagesDir              = wp_upload_dir( null, false )['basedir'] . DIRECTORY_SEPARATOR . '';
      $this->categoriesImagesDir    = $this->imagesDir . 'wpsc' . DIRECTORY_SEPARATOR . 'category_images' . DIRECTORY_SEPARATOR;
      $this->productsImagesDir      = $this->imagesDir;
      $this->manufacturersImagesDir = $this->imagesDir;
    } else {
      $this->imagesDir = 'images' . DIRECTORY_SEPARATOR;
      $this->categoriesImagesDir    = $this->imagesDir;
      $this->productsImagesDir      = $this->imagesDir;
      $this->manufacturersImagesDir = $this->imagesDir;
    }
  }

  /**
   * @return bool
   */
  protected function _tryLoadConfigs($table_prefix = null)
  {
    try {
      $defaultJsonStr = '{"test":"1"}';
      $_POST['not_escaped'] = $defaultJsonStr;

      if (file_exists(M1_STORE_BASE_DIR . 'wp-load.php')) {
        $this->_safeLoad();
      } else {
        @require_once(dirname(M1_STORE_BASE_DIR) . DIRECTORY_SEPARATOR . 'wp-load.php');
      }

      if ($defaultJsonStr !== $_POST['not_escaped']) {
        //WordPress escapes all quotation marks in $_POST variables whether or not PHP's magic_quotes_gpc is enabled. See wp_magic_quotes()
        $_COOKIE  = stripslashes_array($_COOKIE);
        $_GET     = stripslashes_array($_GET);
        $_POST    = stripslashes_array($_POST);
        $_REQUEST = stripslashes_array($_REQUEST);
      }

      unset($_POST['not_escaped']);

      if (defined('DB_NAME') && defined('DB_USER') && defined('DB_HOST')) {
        $this->dbname   = DB_NAME;
        $this->username = DB_USER;
        $this->setHostPort(DB_HOST);
      } else {
        return false;
      }

      if (defined('DB_PASSWORD')) {
        $this->password = DB_PASSWORD;
      } elseif (defined('DB_PASS')) {
        $this->password = DB_PASS;
      } else {
        return false;
      }

      if (defined('WP_CONTENT_DIR')) {
        $this->imagesDir = $this->_relPath(WP_CONTENT_DIR . DIRECTORY_SEPARATOR . 'uploads');
      } elseif (defined('UPLOADS')) {
        $this->imagesDir = $this->_relPath(UPLOADS);
      } else {
        $this->imagesDir = 'wp-content' . DIRECTORY_SEPARATOR . 'uploads';
      }

      if ($this->_multiSiteEnabled = (defined('MULTISITE') && MULTISITE === true)) {
        if (defined('WP_SITEURL')) {
          $this->cartVars['wp_siteurl'] = WP_SITEURL;
        }

        if (defined('WP_HOME')) {
          $this->cartVars['wp_home'] = WP_HOME;
        }

        if (defined('WP_CONTENT_URL')) {
          $this->cartVars['wp_content_url'] = content_url();
        }
      } elseif (defined('WP_CONTENT_URL')) {
        $this->cartVars['wp_content_url'] = content_url();
      }

      if (defined('WP_DEBUG')) {
        $this->cartVars['debugMode'] = WP_DEBUG;
      }

      if (defined('DB_CHARSET')) {
        $this->cartVars['dbCharset'] = DB_CHARSET;
      } else {
        $this->cartVars['dbCharset'] = 'utf8';
      }

      if (defined('ICL_SITEPRESS_VERSION') && class_exists('SitePress') && (!defined('ICL_PLUGIN_INACTIVE') || !ICL_PLUGIN_INACTIVE)) {
        $this->_wpmlEnabled = true;
      }

      $pll = null;

      if (function_exists('PLL')) {
        $pll = PLL();
      }

      if ($pll) {
        $this->_polylangEnabled = true;
      } elseif (defined('POLYLANG_VERSION')) {
        $this->_polylangEnabled = true;
      }

      if (isset($table_prefix)) {
        $this->tblPrefix = $table_prefix;
      } else {
        global $wpdb;

        $this->tblPrefix = $wpdb->prefix;
      }
    } catch (Exception $e) {
      die('ERROR_READING_STORE_CONFIG_FILE');
    }

    foreach (get_defined_vars() as $key => $val) {
      $GLOBALS[$key] = $val;
    }

    return true;
  }

  /**
   * @param string $path Absolute path
   *
   * @return string Relative path
   */
  private function _relPath($path)
  {
    $absPath = realpath($path);
    $absBase = realpath(M1_STORE_BASE_DIR);

    return str_replace($absBase, '', $absPath);
  }

  /**
   * @param array $a2cData Notifications data
   *
   * @return mixed
   * @throws Exception
   */
  public function sendEmailNotifications($a2cData)
  {
    if ($this->_pluginName === 'woocommerce') {
      return $this->_wcEmailNotification($a2cData);
    } else {
      throw new Exception('Action is not supported');
    }
  }

  /**
   * @return void
   */
  private function _safeLoad()
  {
    set_error_handler(function () {
      return true;
    });

    @require_once M1_STORE_BASE_DIR . '/wp-load.php';

    restore_error_handler();
  }

  /**
   * @param int|null $storeId Store ID
   *
   * @return void
   */
  private function _initWooCommerceInMultiSite($storeId = null)
  {
    $wooLoaded = false;

    if (class_exists('WC_Product') || class_exists('WooCommerce')) {
      $wooLoaded = true;
    }

    $wooPluginRel = 'woocommerce/woocommerce.php';
    $activePlugins = (array)get_option('active_plugins', []);

    if ($storeId !== null && function_exists('get_blog_option') && function_exists('is_multisite') && is_multisite()) {
      $activePlugins = (array)get_blog_option((int)$storeId, 'active_plugins', []);
    }

    $isActive = in_array($wooPluginRel, $activePlugins, true);
    $sitewide = [];

    if (function_exists('is_multisite') && is_multisite()) {
      $sitewide = (array)get_site_option('active_sitewide_plugins', []);
    }

    $shouldLoadWoo = true;

    if ($wooLoaded) {
      $shouldLoadWoo = false;
    }

    if ($shouldLoadWoo) {
      if ($isActive || isset($sitewide[$wooPluginRel])) {
        $pluginPath = WP_PLUGIN_DIR . '/' . $wooPluginRel;

        if (is_readable($pluginPath)) {
          include_once $pluginPath;
        }

        if (function_exists('WC')) {
          WC();

          if (!function_exists('did_action') || 0 === did_action('woocommerce_init')) {
            WC()->init();
          }
        }

        if (function_exists('taxonomy_exists') && class_exists('WC_Post_Types')
          && !(taxonomy_exists('product_cat') && taxonomy_exists('product_tag'))
        ) {
          WC_Post_Types::register_taxonomies();
        }

        if (function_exists('post_type_exists') && class_exists('WC_Post_Types') && !post_type_exists('product')) {
          WC_Post_Types::register_post_types();
        }
      }
    }

    $wpmlPluginRel = 'sitepress-multilingual-cms/sitepress.php';
    $wpmlActive = in_array($wpmlPluginRel, $activePlugins, true);

    if ($wpmlActive || isset($sitewide[$wpmlPluginRel])) {
      $wpmlPath = WP_PLUGIN_DIR . '/' . $wpmlPluginRel;

      if (is_readable($wpmlPath)) {
        include_once $wpmlPath;
      }
    }

    if (defined('ICL_SITEPRESS_VERSION') && defined('ICL_PLUGIN_INACTIVE')
      && !ICL_PLUGIN_INACTIVE && class_exists('SitePress')
    ) {
      $this->_wpmlEnabled = true;

      $hasWpmlDic = false;

      if (isset($GLOBALS['wpml_dic'])) {
        $hasWpmlDic = true;
      }

      if ($hasWpmlDic === false) {
        $wpmlBootstrap = WP_PLUGIN_DIR . '/sitepress-multilingual-cms/vendor/wpml/wpml/wpml.php';

        if (is_readable($wpmlBootstrap)) {
          include_once $wpmlBootstrap;
        }
      }

      return;
    }

    $polylangPluginRel = 'polylang/polylang.php';
    $polylangWcPluginRel = 'polylang-wc/polylang-wc.php';
    $polylangActive = in_array($polylangPluginRel, $activePlugins, true);
    $polylangWcActive = in_array($polylangWcPluginRel, $activePlugins, true);

    if ($polylangActive || isset($sitewide[$polylangPluginRel])) {
      $polylangPath = WP_PLUGIN_DIR . '/' . $polylangPluginRel;

      if (is_readable($polylangPath)) {
        include_once $polylangPath;
      }

      if ($polylangWcActive || isset($sitewide[$polylangWcPluginRel])) {
        $polylangWcPath = WP_PLUGIN_DIR . '/' . $polylangWcPluginRel;

        if (is_readable($polylangWcPath)) {
          include_once $polylangWcPath;
        }
      }
    }

    if (class_exists('Polylang') && !isset($GLOBALS['polylang'])) {
      $polylangBootstrap = new Polylang();
      $GLOBALS['polylang'] = $polylangBootstrap;

      if (method_exists($polylangBootstrap, 'init')) {
        $polylangBootstrap->init();
      }
    }

    if (function_exists('PLL') || defined('POLYLANG_VERSION')) {
      $this->_polylangEnabled = true;
    }

    if ($this->_polylangEnabled) {
      $pll = null;
      $model = null;

      if (function_exists('PLL')) {
        $pll = PLL();
      }

      if ($pll && isset($pll->model)) {
        $model = $pll->model;
      }

      $this->_initPolylangWc($model);
    }
  }

  /**
   * @param int $storeId Store ID
   *
   * @return void
   */
  private function _initWooCommerceInMultiSiteContext($storeId)
  {
    if (function_exists('switch_to_blog')) {
      switch_to_blog($storeId);
    }

    if (function_exists('is_multisite') && is_multisite()) {
      $mainBlogId = 1;

      if (function_exists('get_main_site_id')) {
        $mainBlogId = (int)get_main_site_id();
      }

      if ((int)$storeId !== $mainBlogId) {
        $this->_initWooCommerceInMultiSite($storeId);
      }
    }
  }

  /**
   * Ensure Polylang-WC taxonomies and cache are initialized
   *
   * @param object|null $model Polylang model
   *
   * @return void
   */
  protected function _initPolylangWc($model = null)
  {
    $pllWC = null;
    $languages = array();
    $languagesReady = false;

    if (function_exists('PLLWC')) {
      $pllWC = PLLWC();
    }

    if (function_exists('pll_languages_list')) {
      $languages = pll_languages_list();
    }

    if (is_array($languages) && $languages) {
      $languagesReady = true;
    }

    if ($pllWC && $languagesReady && method_exists($pllWC, 'init')) {
      $pllWC->init();
    }

    if ($model && $languagesReady && isset($model->cache)
      && is_object($model->cache) && method_exists($model->cache, 'clean')
    ) {
      $model->cache->clean('taxonomies');

      if (method_exists($model, 'get_translated_taxonomies')) {
        $model->get_translated_taxonomies(false);
      }
    }
  }

  /**
   * @param array $a2cData Notifications data
   *
   * @return bool
   */
  private function _wcEmailNotification($a2cData)
  {
    chdir(M1_STORE_BASE_DIR . '/wp-admin');
    $this->_safeLoad();

    if (function_exists('switch_to_blog')) {
      switch_to_blog($a2cData['store_id']);
    }

    $emails = WC()->mailer()->get_emails();//init mailer

    foreach ($a2cData['notifications'] as $notification) {
      if (isset($notification['wc_class'])) {
        if (isset($emails[$notification['wc_class']])) {
          call_user_func_array(array($emails[$notification['wc_class']], 'trigger'), $notification['data']);
        } else {
          return false;
        }
      } else {
        do_action($notification['wc_action'], $notification['data']);
      }
    }

    return true;
  }

  /**
   * @inheritDoc
   * @return bool
   */
  public function triggerEvents($a2cData)
  {
    chdir(M1_STORE_BASE_DIR . '/wp-admin');
    $this->_safeLoad();

    if (function_exists('switch_to_blog')) {
      switch_to_blog($a2cData['store_id']);
    }

    foreach ($a2cData['events'] as $event) {
      if ($event['event'] === 'update') {
        switch ($event['entity_type']) {
          case 'product':
            $product = WC()->product_factory->get_product($event['entity_id']);
            if (in_array( 'stock_status', $event['updated_meta'], true)) {
              do_action('woocommerce_product_set_stock_status', $product->get_id(), $product->get_stock_status(), $product);
            }
            if (in_array('stock_quantity', $event['updated_meta'], true)) {
              do_action('woocommerce_product_set_stock', $product);
            }

            do_action('woocommerce_product_object_updated_props', $product, $event['updated_meta']);
            break;
          case 'variant':
            $product = WC()->product_factory->get_product($event['entity_id']);
            if (in_array('stock_status', $event['updated_meta'], true)) {
              do_action('woocommerce_variation_set_stock_status', $event['entity_id'], $product->get_stock_status(), $product);
            }
            if (in_array('stock_quantity', $event['updated_meta'], true)) {
              do_action('woocommerce_variation_set_stock', $product);
            }

            do_action('woocommerce_product_object_updated_props', $product, $event['updated_meta']);
            break;
          case 'order':
            $entity = WC()->order_factory->get_order($event['entity_id']);
            do_action( 'woocommerce_order_status_' . $event['status']['to'], $entity->get_id(), $entity);

            if (isset($event['status']['from'])) {
              do_action('woocommerce_order_status_' . $event['status']['from'] . '_to_' . $event['status']['to'], $entity->get_id(), $entity);
              do_action('woocommerce_order_status_changed', $entity->get_id(), $event['status']['from'], $event['status']['to'], $entity);
            }

            break;
          case 'shipment':
            $entity = WC()->order_factory->get_order($event['entity_id']);
            $data = unserialize($a2cData['metaData'], ['allowed_classes' => ['stdClass']]);

            if ( empty($data) ) {
              $entity->delete_meta_data( '_wc_shipment_tracking_items' );
            } else {
              $entity->update_meta_data( '_wc_shipment_tracking_items',  $data );
            }

            $entity->save();
            do_action('update_order_status_after_adding_tracking', $event['status'], $entity);
        }
      } elseif ($event['event'] === 'delete') {
        switch ($event['entity_type']) {
          case 'shipment':
            $entity = WC()->order_factory->get_order($event['entity_id']);

            foreach ($event['tracking_info'] as $trackingInfo) {
              $trackingProvider = $trackingInfo['tracking_provider'];
              $trackingNumber = $trackingInfo['tracking_number'];

              $note = sprintf( esc_html__( 'Tracking info was deleted for tracking provider %1$s with tracking number %2$s', 'woo-advanced-shipment-tracking' ), $trackingProvider, $trackingNumber);
              // Add the note
              $entity->add_order_note($note);
            }
        }
      }
    }

    return true;
  }

  /**
   * @param array $a2cData Data
   *
   * @return mixed
   */
  public function triggerAsOrderShipment($a2cData)
  {
    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => [],
    );

    $reportError = function ($e) {
      return $this->_getBridgeError($e);
    };

    try {
      chdir(M1_STORE_BASE_DIR . '/wp-admin');
      $this->_safeLoad();

      if (function_exists('switch_to_blog')) {
        switch_to_blog($a2cData['store_id']);
      }

      if (class_exists('WH_Helper')) {
        WH_Helper::instance();
      }

      do_action('bridge_tracking_change', true, $a2cData, 1, $a2cData['order_id'], []);

      return $response;
    } catch (Throwable $e ) {
      return $reportError($e);
    }
  }

  /**
   * TriggerEvents Batch
   *
   * @inheritDoc
   * @return array
   */
  public function triggerEventsBatch($a2cData)
  {
    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => [],
    );

    $reportError = function ($e) {
      return $this->_getBridgeError($e);
    };

    try {
      chdir( M1_STORE_BASE_DIR . '/wp-admin' );
      $this->_safeLoad();
    } catch (Throwable $e ) {
      return $reportError($e);
    }

    if (function_exists('switch_to_blog')) {
      switch_to_blog($a2cData['store_id']);
    }

    foreach ($a2cData['data'] as $key => $item) {
      $response['result'][$key]['id'] = null;

      try {
        foreach ($item['events'] as $event) {
          if ('update' === $event['event']) {
            switch ($event['entity_type']) {
              case 'product':
                $product = WC()->product_factory->get_product($event['entity_id']);
                if (in_array('stock_status', $event['updated_meta'], true)) {
                  do_action('woocommerce_product_set_stock_status', $product->get_id(), $product->get_stock_status(), $product);
                }

                if (in_array('stock_quantity', $event['updated_meta'], true)) {
                  do_action('woocommerce_product_set_stock', $product);
                }

                do_action('woocommerce_product_object_updated_props', $product, $event['updated_meta']);
                break;
              case 'variant':
                $product = WC()->product_factory->get_product($event['entity_id']);
                if (in_array('stock_status', $event['updated_meta'], true)) {
                  do_action('woocommerce_variation_set_stock_status', $event['entity_id'], $product->get_stock_status(), $product);
                }

                if (in_array('stock_quantity', $event['updated_meta'], true)) {
                  do_action('woocommerce_variation_set_stock', $product);
                }

                do_action('woocommerce_product_object_updated_props', $product, $event['updated_meta']);
                break;
              case 'order':
                $entity = WC()->order_factory->get_order($event['entity_id']);

                do_action('woocommerce_order_status_' . $event['status']['to'], $entity->get_id(), $entity);

                if (isset($event['status']['from'])) {
                  do_action('woocommerce_order_status_' . $event['status']['from'] . '_to_' . $event['status']['to'], $entity->get_id(), $entity);
                  do_action('woocommerce_order_status_changed', $entity->get_id(), $event['status']['from'], $event['status']['to'], $entity);
                }

                break;
              case 'shipment':
                $entity = WC()->order_factory->get_order($event['entity_id']);
                $data   = unserialize($item['metaData'], ['allowed_classes' => ['stdClass']]);
                $action = 'add';

                if (isset($event['action'])) {
                  $action = $event['action'];
                }

                $existingData = $entity->get_meta('_wc_shipment_tracking_items');

                if (empty($data)) {
                  $entity->delete_meta_data('_wc_shipment_tracking_items');
                } else {
                  if ($action === 'update') {
                    $newData = $data;
                  } else {
                    if (!empty($existingData) && is_array($existingData)) {
                      $existingData[] = $data[0];
                      $newData        = $existingData;
                    } else {
                      $newData = $data;
                    }
                  }

                  $entity->update_meta_data('_wc_shipment_tracking_items', $newData);

                  if ($action === 'add') {
                    $trackingProvider = '';
                    $trackingNumber   = '';

                    if (!empty($data[0]['tracking_provider'])) {
                      $trackingProvider = $data[0]['tracking_provider'];
                    } elseif (!empty($data[0]['custom_tracking_provider'])) {
                      $trackingProvider = $data[0]['custom_tracking_provider'];
                    }

                    if (isset($data[0]['tracking_number'])) {
                      $trackingNumber = $data[0]['tracking_number'];
                    }

                    if ($trackingProvider && $trackingNumber) {
                      /* translators: %1$s: replace with Shipping Provider %2$s: replace with tracking number */
                      $note = sprintf(
                        __('Order was shipped with %1$s and tracking number is: %2$s', 'bridge-connector-wdr'),
                        $trackingProvider,
                        $trackingNumber
                      );

                      $entity->add_order_note($note);
                    }
                  }
                }

                $entity->save_meta_data();
                do_action('update_order_status_after_adding_tracking', $event['status'], $entity);
            }
          } elseif ('delete' === $event['event']) {
            switch ($event['entity_type']) {
              case 'shipment':
                $entity = WC()->order_factory->get_order($event['entity_id']);

                foreach ($event['tracking_info'] as $trackingInfo) {
                  $trackingProvider = $trackingInfo['tracking_provider'];
                  $trackingNumber   = $trackingInfo['tracking_number'];

                  // translators: %1$s is the tracking provider, %2$s is the tracking number
                  $note = sprintf(
                    esc_html__('Tracking info was deleted for tracking provider %1$s with tracking number %2$s', 'bridge-connector-wdr'),
                    $trackingProvider,
                    $trackingNumber
                  );
                  // Add the note
                  $entity->add_order_note($note);
                }
            }
          }
        }
      } catch (Exception $e) {
        $response['result'][$key]['errors'][] = $reportError($e);
      } catch (Throwable $e) {
        $response['result'][$key]['errors'][] = $reportError($e);
      }
    }

    return $response;
  }

  /**
   * @inheritDoc
   * @return array
   */
  public function setMetaData($a2cData)
  {
    $response = [
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error' => null,
      'result' => array()
    ];

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      chdir(M1_STORE_BASE_DIR . '/wp-admin');
      $this->_safeLoad();

      if (function_exists('switch_to_blog')) {
        switch_to_blog($a2cData['store_id']);
      }

      $id = (int)$a2cData['entity_id'];

      switch ($a2cData['entity']) {
        case 'variant':
        case 'product':
          $entity = WC()->product_factory->get_product($id);
          break;
        case 'order':
          $entity = WC()->order_factory->get_order($id);
          break;
        case 'category':
          $entity = get_term($id, 'product_cat');
          break;
        case 'customer':
          $entity = new WC_Customer($id);
          break;
      }

      if (!$entity) {
        $response['error_code'] = self::ERROR_CODE_ENTITY_NOT_FOUND;
        $response['error'] = $a2cData['entity'];
      } elseif ($a2cData['entity'] != 'category') {
        if (isset($a2cData['meta'])) {
          foreach ($a2cData['meta'] as $key => $value) {
            $entity->add_meta_data($key, $value, true);
          }
        }

        if (isset($a2cData['unset_meta'])) {
          foreach ($a2cData['unset_meta'] as $key) {
            $entity->delete_meta_data($key);
          }
        }

        if (isset($a2cData['meta']) || isset($a2cData['unset_meta'])) {
          $entity->save();

          if (isset($a2cData['meta'])) {
            global $wpdb;
            $wpdb->set_blog_id($a2cData['store_id']);
            $keys = implode( "', '", $wpdb->_escape(array_keys($a2cData['meta'])));

            switch ($a2cData['entity']) {
              case 'product':
              case 'variant':
              case 'order':
                $wooOrderTableEnabled = 'order' === $a2cData['entity'] && get_option('woocommerce_custom_orders_table_enabled') === 'yes';

                if ($wooOrderTableEnabled) {
                    $metaTable = $wpdb->prefix . 'wc_orders_meta';
                    $metaIdField = 'm.id AS meta_id';
                    $entityIdField = 'm.order_id';
                } else {
                    $metaTable = $wpdb->postmeta;
                    $metaIdField = 'm.meta_id';
                    $entityIdField = 'm.post_id';
                }

                $sql = "
                  SELECT {$metaIdField}, m.meta_key, m.meta_value
                  FROM {$metaTable} AS m
                  WHERE {$entityIdField} = %d
                    AND m.meta_key IN ('{$keys}')";
                $qRes = $wpdb->get_results($wpdb->prepare($sql, $id));
                break;

              case 'customer':
                $qRes = $wpdb->get_results("
                SELECT um.umeta_id AS 'meta_id', um.meta_key, um.meta_value
                FROM {$wpdb->usermeta} AS um
                WHERE um.user_id = {$id}
                  AND um.meta_key IN ('{$keys}')"
                );

                break;
            }

            $response['result']['meta'] = $qRes;
          }

          if (isset($a2cData['unset_meta'])) {
            foreach ($a2cData['unset_meta'] as $key) {
              $response['result']['removed_meta'][$key] = !(bool)$entity->get_meta($key);
            }
          }
        }
      } else {
        if (isset($a2cData['meta'])) {
          global $wpdb;

          foreach ($a2cData['meta'] as $key => $value) {
            add_term_meta($id, $key, $value);
          }

          $wpdb->set_blog_id($a2cData['store_id']);
          $keys = implode( "', '", $wpdb->_escape(array_keys($a2cData['meta'])));

          $qRes = $wpdb->get_results("
            SELECT tm.meta_id, tm.meta_key, tm.meta_value
            FROM {$wpdb->termmeta} AS tm
            WHERE tm.term_id = {$id}
              AND tm.meta_key IN ('{$keys}')"
          );

          $response['result']['meta'] = $qRes;
        }

        if (isset($a2cData['unset_meta'])) {
          foreach ($a2cData['unset_meta'] as $key) {
            delete_term_meta($id, $key);

            $response['result']['removed_meta'][$key] = !(bool)get_term_meta($id, $key);
          }
        }
      }
    } catch (Exception $e) {
      return $reportError($e);
    } catch (Throwable $e) {
      return $reportError($e);
    }

    return $response;
  }

  /**
   * @inheritDoc
   * @return array
   */
  public function getTranslations($a2cData)
  {
    $response = [
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error' => null,
      'result' => array()
    ];

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      chdir(M1_STORE_BASE_DIR . '/wp-admin');
      $this->_safeLoad();

      if (function_exists('switch_to_blog')) {
        switch_to_blog($a2cData['store_id']);
      }

      foreach ($a2cData['strings'] as $key => $stringData) {
        $response['result'][$key] = esc_html__($stringData['id'], $stringData['domain']);
      }
    } catch (Exception $e) {
      return $reportError($e);
    } catch (Throwable $e) {
      return $reportError($e);
    }

    return $response;
  }

  /**
   * @inheritDoc
   * @return array
   */
  public function getWdrPrice($a2cData)
  {
    $response = [
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error' => null,
      'result' => array()
    ];

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      chdir(M1_STORE_BASE_DIR . '/wp-admin');
      $this->_safeLoad();

      if (function_exists('switch_to_blog')) {
        switch_to_blog($a2cData['store_id']);
      }

      $class = new Wdr\App\Controllers\ManageDiscount();

      foreach ($a2cData['args'] as $args) {
        $response['result'][$args[0]][$args[1]] = $class::calculateInitialAndDiscountedPrice($args[0], $args[1]);
      }
    } catch (Exception $e) {
      return $reportError($e);
    } catch (Throwable $e) {
      return $reportError($e);
    }

    return $response;
  }

  /**
   * @inheritDoc
   * @return array
   */
  public function setOrderNotes($a2cData)
  {
    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error' => null,
      'result' => array()
    );

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      chdir(M1_STORE_BASE_DIR . '/wp-admin');
      $this->_safeLoad();

      if (function_exists('switch_to_blog')) {
        switch_to_blog($a2cData['store_id']);
      }

      $order = WC()->order_factory->get_order((int)$a2cData['order_id']);

      if (!$order) {
        $response['error_code'] = self::ERROR_CODE_ENTITY_NOT_FOUND;
        $response['error'] = 'Entity not found';
      } else {
        if (empty($a2cData['from'])) {
          /* translators: %s: new order status */
          $transition_note = sprintf(esc_html__('Order status set to %s.', 'woocommerce'), wc_get_order_status_name($a2cData['to']));

          if (empty($a2cData['added_by_user'])) {
            $this->_addOrderNote($order->get_id(), $transition_note);
          } else {
            $this->_addOrderNote($order->get_id(), $transition_note, 0, true);
          }
        } else {
          /* translators: 1: old order status 2: new order status */
          $transition_note = sprintf(
            esc_html__('Order status changed from %1$s to %2$s.', 'woocommerce'),
            wc_get_order_status_name($a2cData['from']),
            wc_get_order_status_name($a2cData['to'])
          );

          if (empty($a2cData['added_by_user'])) {
            $this->_addOrderNote($order->get_id(), $transition_note);
          } else {
            $this->_addOrderNote($order->get_id(), $transition_note, 0, true);
          }
        }
      }
    } catch (Exception $e) {
      return $reportError($e);
    } catch (Throwable $e) {
      return $reportError($e);
    }

    return $response;
  }

  /**
   * @param array $a2cData
   *
   * @return array
   */
  public function getImagesUrls($a2cData)
  {
    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error' => null,
      'result' => array()
    );

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      chdir(M1_STORE_BASE_DIR . '/wp-admin');
      $this->_safeLoad();

      foreach ($a2cData as $imagesCollection) {
        if (function_exists('switch_to_blog')) {
          switch_to_blog($imagesCollection['store_id']);
        }

        $images = array();
        foreach ($imagesCollection['ids'] as $id) {
          $images[$id] = wp_get_attachment_url($id);
        }

        $response['result'][$imagesCollection['store_id']] = array('images' => $images);
      }
    } catch (Exception $e) {
      return $reportError($e);
    } catch (Throwable $e) {
      return $reportError($e);
    }

    return $response;
  }

  /**
   * @return array
   */
  public function getPlugins()
  {
    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error' => null,
      'result' => array()
    );

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      chdir(M1_STORE_BASE_DIR . '/wp-admin');
      $this->_safeLoad();
      @require_once M1_STORE_BASE_DIR . 'wp-admin/includes/plugin.php';

      if (function_exists('get_plugins')) {
        $response['result']['plugins'] = get_plugins();
      }

    } catch (Exception $e) {
      return $reportError($e);
    } catch (Throwable $e) {
      return $reportError($e);
    }

    return $response;
  }

  /**
   * Category Add
   *
   * @param array $a2cData Data
   *
   * @return array
   */
  public function categoryAdd($a2cData) {
    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => array(),
    );

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      chdir(M1_STORE_BASE_DIR . '/wp-admin');
      $this->_safeLoad();

      $this->_initWooCommerceInMultiSiteContext($a2cData['store_id']);

      $termType = 'product_cat';

      $termArgs = [
        'slug' => $a2cData['meta_data']['slug'],
        'parent' => $a2cData['meta_data']['parent'],
        'description' => $a2cData['meta_data']['description']
      ];

      //WPML support
      if (defined('ICL_SITEPRESS_VERSION') && defined('ICL_PLUGIN_INACTIVE') && !ICL_PLUGIN_INACTIVE && class_exists('SitePress')) {
        if (isset($a2cData['meta_data']['icl_tax_product_cat_language'])) {
          do_action('wpml_switch_language', $a2cData['meta_data']['icl_tax_product_cat_language']);
          $currentLangCode = $a2cData['meta_data']['icl_tax_product_cat_language'];
        } else {
          $currentLangCode = apply_filters( 'wpml_default_language', null );
        }

        if (isset( $a2cData['meta_data']['icl_translation_of'])) {
          $trId = apply_filters('wpml_element_trid', null, (int)$a2cData['meta_data']['icl_translation_of'], 'tax_' . $termType);
        } else {
          $trId = null;
        }

        // fix hierarchy.
        if ($a2cData['meta_data']['parent']) {
          $originalParentTranslated = apply_filters('translate_object_id', $a2cData['meta_data']['parent'], $termType, false, $currentLangCode);

          if ($originalParentTranslated) {
            $termArgs['parent'] = $originalParentTranslated;
          } else {
            $termParent = get_term_by('id', (int)$a2cData['meta_data']['parent'], 'product_cat');

            if ($termParent) {
              $trIdParent = apply_filters('wpml_element_trid', null, $termParent->term_taxonomy_id, 'tax_' . $termType);
              $parentTranslations = apply_filters('wpml_get_element_translations', null, $trIdParent, 'tax_' . $termType, false, true);

              if (!key_exists($currentLangCode, $parentTranslations)) {
                $termParentArgs = [
                  'name' => $termParent->name,
                  'slug' => WPML_Terms_Translations::term_unique_slug($termParent->slug, $termType, $currentLangCode),
                ];

                $newParentTerm = wp_insert_term($termParent->name, $termType, $termParentArgs);

                if ($newParentTerm && !is_wp_error($newParentTerm)) {
                  $setLanguageArgs = array(
                    'element_id'    => $newParentTerm['term_taxonomy_id'],
                    'element_type'  => 'tax_' . $termType,
                    'trid'          => $trIdParent,
                    'language_code' => $currentLangCode,
                  );

                  do_action('wpml_set_element_language_details', $setLanguageArgs);
                  $termArgs['parent'] = $newParentTerm['term_id'];
                }
              } else {
                $termArgs['parent'] = $parentTranslations[$currentLangCode]['term_id'];
              }
            }
          }
        }

        $newTerm = wp_insert_term($a2cData['meta_data']['tag-name'], $termType, $termArgs);

        if ($newTerm && !is_wp_error($newTerm)) {
          $setLanguageArgs = array(
            'element_id'    => $newTerm['term_taxonomy_id'],
            'element_type'  => 'tax_' . $termType,
            'trid'          => $trId,
            'language_code' => $currentLangCode,
          );

          do_action('wpml_set_element_language_details', $setLanguageArgs);
        } else {
          throw new Exception(esc_html__('[BRIDGE ERROR]: Can\'t create category!', 'woocommerce'));
        }
      } elseif ($this->_polylangEnabled) {
        $polylangLangCode = isset($a2cData['meta_data']['lang_code']) ? $a2cData['meta_data']['lang_code'] : null;

        if (!$polylangLangCode && function_exists('pll_default_language')) {
          $polylangLangCode = pll_default_language('slug');
        }

        $polylangModel = $this->_getPolylangModel();
        $polylangTermModel = $polylangModel && isset($polylangModel->term) ? $polylangModel->term : null;

        if ($polylangLangCode && !empty($termArgs['parent'])) {
          $translatedParentId = $this->_createPolylangTermTranslation(
            (int)$termArgs['parent'],
            $polylangLangCode,
            $termType,
            $polylangTermModel
          );

          if ($translatedParentId) {
            $termArgs['parent'] = $translatedParentId;
          }
        }

        $newTerm = wp_insert_term($a2cData['meta_data']['tag-name'], $termType, $termArgs);

        if ($newTerm && !is_wp_error($newTerm)) {
          $termId = 0;

          if ($newTerm instanceof WP_Term) {
            $termId = (int)$newTerm->term_id;
          } elseif (is_array($newTerm) && isset($newTerm['term_id'])) {
            $termId = (int)$newTerm['term_id'];
          }

          if ($termId > 0) {
            if (function_exists('pll_set_term_language')) {
              pll_set_term_language($termId, $polylangLangCode);
            } elseif ($polylangTermModel) {
              $polylangTermModel->set_language($termId, $polylangLangCode);
            }
          }
        }
      } else {
        $newTerm = wp_insert_term($a2cData['meta_data']['tag-name'], $termType, $termArgs);
      }

      return $newTerm;
    } catch (Exception $e) {
      return $reportError($e);
    } catch (Throwable $e) {
      return $reportError($e);
    }
  }


  /**
   * @param array $a2cData A2C Data
   *
   * @return array
   */
  public function categoryAddBatch($a2cData) {
    $response = [
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => [],
    ];

    $reportError = function ($e) {
      return $this->_getBridgeError($e);
    };

    chdir(M1_STORE_BASE_DIR . '/wp-admin');
    $this->_safeLoad();

    $this->_initWooCommerceInMultiSiteContext($a2cData['store_id']);

    if (defined('ICL_SITEPRESS_VERSION') && defined('ICL_PLUGIN_INACTIVE') && !ICL_PLUGIN_INACTIVE && class_exists('SitePress')) {
      $this->_wpmlEnabled = true;

      $sitepress       = WPML\Container\make('\SitePress');
      $activeLanguages = $sitepress->get_active_languages(true);
    } else {
      $activeLanguages = [];
    }

    foreach ($a2cData['data'] as $key => $item) {
      $response['result'][$key]['id'] = null;

      try {
        $term     = null;
        $taxonomy = 'product_cat';
        $name     = $item['name'];
        $args     = [];

        if (isset($item['description'])) {
          $args['description'] = $item['description'];
        }

        if (isset($item['slug'])) {
          $args['slug'] = $item['slug'];
        }

        if (isset($item['parent'])) {
          $args['parent'] = $item['parent'];
        }

        $term = wp_insert_term($name, $taxonomy, $args);

        if (is_wp_error($term)) {
          throw new Exception(esc_html__('Can\'t create category! Error: ' . $term->get_error_message(), 'woocommerce'));
        }

        $term = get_term($term['term_id'], $taxonomy);
        $termId = (int)$term->term_id;
        $response['result'][$key]['id'] = $termId;

        if (isset($item['menu_order'])) {
          update_term_meta($termId, 'order', $item['menu_order']);
        }

        if ($this->_wpmlEnabled) {
          $this->_translateTaxonomy([$termId], $taxonomy, $activeLanguages, true);
        } elseif ($this->_polylangEnabled) {
          $polylangTermModel = null;
          $polylangModel = $this->_getPolylangModel();

          if ($polylangModel && isset($polylangModel->term)) {
            $polylangTermModel = $polylangModel->term;
          }

          $polylangLanguages = $this->_getPolylangLanguagesList($polylangModel);

          $termLangCode = isset($item['lang_code']) ? $item['lang_code'] : null;

          if (!$termLangCode && function_exists('pll_default_language')) {
            $termLangCode = pll_default_language('slug');
          }

          if (!$termLangCode && $polylangLanguages) {
            $termLangCode = $polylangLanguages[0];
          }

          $this->_polylangTranslateTaxonomy([$termId], $taxonomy, $polylangLanguages, $polylangTermModel, $termLangCode);
        }

        if (isset($item['image'])) {
          $upload = wc_rest_upload_image_from_url(esc_url_raw($item['image']['src']));

          if (is_wp_error($upload)) {
            if (!apply_filters('woocommerce_rest_suppress_image_upload_error', false, $upload, $termId, [$item['image']])) {
              throw new WC_Data_Exception('woocommerce_product_image_upload_error', $upload->get_error_message());
            } else {
              continue;
            }
          }

          $attachmentId = wc_rest_set_uploaded_image_as_attachment($upload, $termId);

          if ($attachmentId && wp_attachment_is_image($attachmentId)) {
            if ($this->_wpmlEnabled) {
              foreach ($activeLanguages as $activeLanguage) {
                do_action('wpml_switch_language', $activeLanguage['code']);
                $trId = apply_filters('translate_object_id', $termId, $taxonomy, false, $activeLanguage['code']);

                if (!is_null($trId)) {
                  update_term_meta($trId, 'thumbnail_id', $attachmentId);
                }
              }
            } elseif ($this->_polylangEnabled) {
              $termIds = [$termId];
              $translations = $this->_getPolylangTermTranslationIds($termId);

              foreach ($translations as $translationId) {
                if ((int)$translationId > 0) {
                  $termIds[] = (int)$translationId;
                }
              }

              foreach (array_unique($termIds) as $translationId) {
                update_term_meta($translationId, 'thumbnail_id', $attachmentId);
              }
            } else {
              update_term_meta($termId, 'thumbnail_id', $attachmentId);
            }

            if (!empty($item['image']['alt'])) {
              update_post_meta($attachmentId, '_wp_attachment_image_alt', wc_clean($item['image']['alt']));
            }

            if (!empty($item['image']['name'])) {
              wp_update_post(
                array(
                  'ID'         => $attachmentId,
                  'post_title' => wc_clean($item['image']['name']),
                )
              );
            }
          } else {
            delete_term_meta($termId, 'thumbnail_id');
          }
        }
      } catch (Exception $e) {
        $response['result'][$key]['errors'][] = $reportError($e);
      } catch (Throwable $e) {
        $response['result'][$key]['errors'][] = $reportError($e);
      }
    }

    return $response;
  }

  /**
   * @param array $a2cData Data
   *
   * @return array
   */
  public function categoryUpdate($a2cData)
  {
    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => array(),
    );

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      chdir(M1_STORE_BASE_DIR . '/wp-admin');
      $this->_safeLoad();
      $args = array_merge(
        $a2cData,
        array(
          'action'   => 'editedtag',
          'taxonomy' => 'product_cat',
        )
      );

      if (isset($args['icl_tax_product_cat_language'])) {
        $sitepress = WPML\Container\make( '\SitePress' );
        $sitepress->switch_lang($args['icl_tax_product_cat_language']);
      }

      wp_update_term($args['tag_ID'], 'product_cat', $args);
      $response['result'] = true;
    } catch (Exception $e) {
      return $reportError($e);
    } catch (Throwable $e) {
      return $reportError($e);
    }

    return $response;
  }

  /**
   * @param array $a2cData Data
   *
   * @return array
   */
  public function categoryDelete($a2cData)
  {
    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => array(),
    );

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      chdir(M1_STORE_BASE_DIR . '/wp-admin');
      $this->_safeLoad();

      if (isset($a2cData['icl_tax_product_cat_language'])) {
        $sitepress = WPML\Container\make( '\SitePress' );
        $sitepress->switch_lang($a2cData['icl_tax_product_cat_language']);
      }

      wp_delete_term( $a2cData['entity_id'], 'product_cat' );
      $response['result'] = true;
    } catch (Exception $e) {
      return $reportError($e);
    } catch (Throwable $e) {
      return $reportError($e);
    }

    return $response;
  }

  /**
   * @param array $a2cData Data
   *
   * @return array
   */
  public function orderUpdate($a2cData)
  {
    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error' => null,
      'result' => array()
    );

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      chdir(M1_STORE_BASE_DIR . '/wp-admin');
      $this->_safeLoad();

      foreach (get_defined_vars() as $key => $val) {
        $GLOBALS[$key] = $val;
      }

      $this->_resetGlobalVars();

      if (function_exists('switch_to_blog')) {
        switch_to_blog($a2cData['order']['store_id']);
      }

      $entity = WC()->order_factory->get_order($a2cData['order']['id']);

      if (!empty($a2cData["order"]["meta_data"])) {
        foreach ($a2cData["order"]["meta_data"] as $metaData) {
          $entity->update_meta_data($metaData['key'], $metaData['value']);
        }
      }

      if (isset($a2cData['order']['notify_customer']) && $a2cData['order']['notify_customer'] === false) {
        $disableEmails = function () {
          return false;
        };

        add_filter('woocommerce_email_enabled_customer_completed_order', $disableEmails, 100, 0);
        add_filter('woocommerce_email_enabled_customer_invoice', $disableEmails, 100, 0);
        add_filter('woocommerce_email_enabled_customer_note', $disableEmails, 100, 0);
        add_filter('woocommerce_email_enabled_customer_on_hold_order', $disableEmails, 100, 0);
        add_filter('woocommerce_email_enabled_customer_processing_order', $disableEmails, 100, 0);
        add_filter('woocommerce_email_enabled_customer_refunded_order', $disableEmails, 100, 0);
      }

      if (isset($a2cData['order']['status']['id'])) {
        $entity->set_status(
          $a2cData['order']['status']['id'],
          isset($a2cData['order']['status']['transition_note']) ? $a2cData['order']['status']['transition_note'] : '',
          true
        );
      }

      if (isset($a2cData['order']['completed_date'])) {
        $entity->set_date_completed($a2cData['order']['completed_date']);
      }

      if (isset($a2cData['order']['admin_comment'])) {
        $this->_addOrderNote($entity->get_id(), $a2cData['order']['admin_comment']['text'], 1);
      }

      if (isset($a2cData['order']['customer_note'])) {
        $entity->set_customer_note($a2cData['order']['customer_note']);
      }

      if (isset($a2cData['order']['admin_private_comment'])) {
        $this->_addOrderNote($entity->get_id(), $a2cData['order']['admin_private_comment']['text'], 0, true);
      }

      $entity->save();

      $response['result'] = true;

    } catch (Exception $e) {
      return $reportError($e);
    } catch (Throwable $e) {
      return $reportError($e);
    }

    return $response;
  }

  /**
   * @return array
   */
  public function sendReturnEmails($a2cData)
  {
    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error' => null,
      'result' => array()
    );

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      chdir(M1_STORE_BASE_DIR . '/wp-admin');
      $this->_safeLoad();

      if (function_exists('switch_to_blog')) {
        switch_to_blog($a2cData['store_id']);
      }

      if ($a2cData['plugin'] === 'woocommerce-refund-and-exchange-lite') {
        if ($a2cData['is_comment']) {
          $customer_email = WC()->mailer()->emails['wps_rma_order_messages_email'];
          $customer_email->trigger($a2cData['data']['msg'], [], $a2cData['data']['to'], $a2cData['order_id']);
        } else {
          if (!$a2cData['is_update_method'] || $a2cData['return_status'] === 'pending') {
            do_action('wps_rma_refund_req_email', $a2cData['order_id']);
          }

          if ($a2cData['return_status'] === 'complete') {
            do_action('wps_rma_refund_req_accept_email', $a2cData['order_id']);
          } elseif ($a2cData['return_status'] === 'cancel') {
            do_action('wps_rma_refund_req_cancel_email', $a2cData['order_id']);
          }
        }
      }
    } catch (Exception $e) {
      return $reportError($e);
    } catch (Throwable $e) {
      return $reportError($e);
    }

    return $response;
  }

  /**
   * @param array $a2cData Data
   *
   * @return array
   */
  public function imageAdd($a2cData)
  {
    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error' => null,
      'result' => array()
    );

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    $allowedMimes = array(
      'jpg|jpeg|jpe' => 'image/jpeg',
      'gif'          => 'image/gif',
      'png'          => 'image/png',
      'bmp'          => 'image/bmp',
      'tiff|tif'     => 'image/tiff',
      'ico'          => 'image/x-icon',
      'webp'         => 'image/webp',
    );

    try {
      chdir(M1_STORE_BASE_DIR . '/wp-admin');
      $this->_safeLoad();
      @require_once( M1_STORE_BASE_DIR . '/wp-admin/includes/image.php' );
      $productIds = [];
      $variantIds = [];
      $categoryIds = [];
      $isProduct = true;
      $productId = 0;

      if (isset($a2cData['category_id'])) {
        $categoryIds = [(int)$a2cData['category_id']];
        $isProduct = false;
      } elseif (isset($a2cData['category_ids']) && is_array($a2cData['category_ids'])) {
        foreach ($a2cData['category_ids'] as $catId) {
          $categoryIds[] = (int)$catId;
        }
        $isProduct = false;
      }

      if ($isProduct === true) {
        $productIds = $a2cData['product_ids'];
        $productId  = $a2cData['product_ids'][0];
        $variantIds = $a2cData['variant_ids'];
      }

      $alt = '';

      if (empty($a2cData['alt']) === false) {
        $alt = $a2cData['alt'];
      }

      $this->_initWooCommerceInMultiSiteContext($a2cData['store_id']);

      if ($a2cData['content']) {
        $img      = str_replace('data:image/jpeg;base64,', '', $a2cData['content']);
        $img      = str_replace(' ', '+', $img);
        $decoded  = base64_decode($img);
        $filename = $a2cData['name'];

        $file = wp_upload_bits($filename, null, $decoded);
        if ($file['error'] !== false) {
          /* translators: %s: File name */
          throw new Exception( sprintf( esc_html__( '[BRIDGE ERROR]: File save failed %s!', 'woocommerce' ), $filename ));
        }

      } elseif ($a2cData['source']) {
        $imageUrl = $a2cData['source'];
        $filename = $a2cData['name'];
        $parsedUrl = wp_parse_url( $imageUrl );

        if (!$parsedUrl || !is_array( $parsedUrl)) {
          /* translators: %s: Image Url */
          throw new Exception( sprintf( esc_html__( '[BRIDGE ERROR]: Invalid URL %s!', 'woocommerce' ), $parsedUrl ));
        }

        $imageUrl = esc_url_raw( $imageUrl );

        if (function_exists('download_url') === false) {
          include_once M1_STORE_BASE_DIR . '/wp-admin/includes/file.php';
        }

        $fileArray         = array();
        $fileArray['name'] = basename( $filename );
        $fileArray['tmp_name'] = download_url( $imageUrl );

        if (is_wp_error($fileArray['tmp_name'])) {
          throw new Exception(
            sprintf( esc_html__( '[BRIDGE ERROR]: Some error occurred while retrieving the remote image by URL: %s!', 'woocommerce' ), $imageUrl ) . ' '
            . sprintf( esc_html__( 'Error: %s', 'woocommerce' ), $fileArray['tmp_name']->get_error_message() )
          );
        }

        $file = wp_handle_sideload(
          $fileArray,
          array(
            'test_form' => false,
            'mimes'     => $allowedMimes,
          ),
          current_time( 'Y/m' )
        );

        if (isset($file['error'])) {
          @unlink( $fileArray['tmp_name'] );

          throw new Exception( 'IMAGE NOT SUPPORTED', $imageUrl );
        }

        do_action( 'woocommerce_rest_api_uploaded_image_from_url', $file, $imageUrl );
      }

      if (empty($file['file'])) {
        throw new Exception(esc_html__( '[BRIDGE ERROR]: No image has been uploaded!', 'woocommerce'));
      }

      if ($isProduct === true) {
        if ( defined('ICL_SITEPRESS_VERSION') && class_exists('SitePress') && (!defined('ICL_PLUGIN_INACTIVE') || !ICL_PLUGIN_INACTIVE)) {
          global $sitepress;

          $sitepress = WPML\Container\make('\SitePress');
          $currentLanguage = apply_filters('wpml_current_language', NULL);

          foreach ($productIds as $productId) {
            $objectId =  apply_filters('wpml_object_id', $productId, 'post_product', true, $currentLanguage);

            if ($objectId === null) {
              continue;
            }

            $trid = apply_filters('wpml_element_trid', NULL, $objectId, 'post_product');
            $translations = apply_filters('wpml_get_element_translations', NULL, $trid, 'post_product', false, true);

            foreach ($translations as $translation) {
              if (is_object($translation)) {
                $productIds[] = $translation->{'element_id'};
              } elseif (is_array($translation)) {
                $productIds[] = $translation['element_id'];
              }
            }
          }

          foreach ($variantIds as $variantId) {
            $objectId =  apply_filters('wpml_object_id', $variantId, 'post_product_variation', true, $currentLanguage);

            if ($objectId === null) {
              continue;
            }

            $trid = apply_filters('wpml_element_trid', NULL, $objectId, 'post_product_variation');
            $translations = apply_filters('wpml_get_element_translations', NULL, $trid, 'post_product_variation', false, true);

            foreach ($translations as $translation) {
              if (is_object($translation)) {
                $variantIds[] = $translation->{'element_id'};
              } elseif (is_array($translation)) {
                $variantIds[] = $translation['element_id'];
              }
            }
          }

          $productIds = array_unique($productIds);
          $variantIds = array_unique($variantIds);
        }
      } else {
        $applyToTranslations = true;

        if (isset($a2cData['apply_to_translations'])) {
          $applyToTranslations = (bool)$a2cData['apply_to_translations'];
        }

        $categoryIds = $this->_getCategoryImageTermIds($categoryIds[0], $applyToTranslations);
      }

      if ($isProduct) {
        $attachmentParentId = $productId;
      } else {
        $attachmentParentId = 0;
      }

      $attachmentId = wp_insert_attachment(
        [
          'guid'           => wp_upload_dir()['url'] . '/' . basename($file['file']),
          'post_mime_type' => $file['type'],
          'post_title'     => basename($file['file']),
          'post_content'   => '',
          'post_status'    => 'inherit',
        ],
        $file['file'],
        $attachmentParentId
      );

      if (!empty($alt)) {
        update_post_meta($attachmentId, '_wp_attachment_image_alt', wc_clean($alt));
      }

      $attachmentData = wp_generate_attachment_metadata( $attachmentId, $file['file'] );

      wp_update_attachment_metadata($attachmentId,  $attachmentData);

      if ($isProduct) {
        foreach ($productIds as $productId) {
          if ($a2cData['is_thumbnail']) {
            set_post_thumbnail( $productId, $attachmentId );
          }

          if ($a2cData['is_gallery']) {
            $WCProduct = WC()->product_factory->get_product($productId);

            if ($WCProduct->get_type() !== 'variation') {
              $galleryIds   = $WCProduct->get_gallery_image_ids();
              $galleryIds[] = $attachmentId;
              $WCProduct->set_gallery_image_ids(array_unique($galleryIds));
              $WCProduct->save();
            }
          }
        }

        foreach ($variantIds as $variantId) {
          if ($a2cData['is_thumbnail']) {
            set_post_thumbnail( $variantId, $attachmentId );
          }

          if ($a2cData['is_gallery']) {
            $images = get_post_meta($variantId, 'woo_variation_gallery_images', true);//https://wordpress.org/plugins/woo-variation-gallery support

            if (empty($images)) {
              $variationGallery = [$attachmentId];
            } else {
              $variationGallery = array_unique(array_merge([$attachmentId], $images));
            }

            update_post_meta($variantId, 'woo_variation_gallery_images', $variationGallery);
          }
        }
      } else {
        foreach ($categoryIds as $termId) {
          update_term_meta($termId, 'thumbnail_id', $attachmentId);
        }
      }

      $response['result']['image_id'] = $attachmentId;
      $response['result']['src'] = wp_get_attachment_url( $attachmentId );

    } catch (Exception $e) {
      return $reportError($e);
    } catch (Throwable $e) {
      return $reportError($e);
    }

    return $response;
  }

  /**
   * @param int  $categoryId          Category ID
   * @param bool $applyToTranslations Apply to all translations
   *
   * @return array
   */
  protected function _getCategoryImageTermIds($categoryId, $applyToTranslations)
  {
    $categoryIds = array($categoryId);
    $translations = array();

    if ($this->_wpmlEnabled) {
      $translations = $this->_getWpmlTermTranslationIds($categoryId, 'product_cat');
    } elseif ($this->_polylangEnabled) {
      $translations = $this->_getPolylangTermTranslationIds($categoryId);
    }

    foreach ($translations as $termId) {
      $termId = (int)$termId;

      if ($termId > 0) {
        $categoryIds[] = $termId;
      }
    }

    if ($applyToTranslations) {
      return array_values(array_unique($categoryIds));
    }

    return array_values(array_unique(array($categoryId)));
  }

  /**
   * @param int    $termId   Term ID
   * @param string $taxonomy Taxonomy
   *
   * @return array
   */
  protected function _getWpmlTermTranslationIds($termId, $taxonomy)
  {
    $categoryIds = array();
    $taxonomyId = 0;
    $term = get_term($termId, $taxonomy);

    if ($term && !is_wp_error($term)) {
      $taxonomyId = (int)$term->term_taxonomy_id;
    }

    if ($taxonomyId > 0) {
      $trid = apply_filters('wpml_element_trid', null, $taxonomyId, 'tax_' . $taxonomy);

      if ($trid) {
        $translations = apply_filters('wpml_get_element_translations', null, $trid, 'tax_' . $taxonomy, false, true);

        foreach ($translations as $translation) {
          $termTranslationId = 0;

          if (is_object($translation) && isset($translation->term_id)) {
            $termTranslationId = (int)$translation->term_id;
          } elseif (is_array($translation) && isset($translation['term_id'])) {
            $termTranslationId = (int)$translation['term_id'];
          }

          if ($termTranslationId > 0) {
            $categoryIds[] = $termTranslationId;
          }
        }
      }
    }

    return $categoryIds;
  }

  /**
   * @param int $termId Term ID
   *
   * @return array
   */
  protected function _getPolylangTermTranslationIds($termId)
  {
    $termModel = null;
    $categoryIds = array();

    if (function_exists('PLL')) {
      $pll = PLL();

      if ($pll && isset($pll->model) && isset($pll->model->term)) {
        $termModel = $pll->model->term;
      }
    }

    $translations = $this->_getPolylangTermTranslations($termId, $termModel);

    foreach ($translations as $termId) {
      $termId = (int)$termId;

      if ($termId > 0) {
        $categoryIds[] = $termId;
      }
    }

    return $categoryIds;
  }

  /**
   * @return array
   */
  public function productAddAction($a2cData)
  {
    $productId = 0;

    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error' => null,
      'result' => array()
    );

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      $response['result']['product_id'] = $this->_importProduct($a2cData, 0, $productId);
    } catch (Exception $e) {
      $this->_cleanGarbage($productId);

      return $reportError($e);
    } catch (Throwable $e) {
      $this->_cleanGarbage($productId);

      return $reportError($e);
    }

    return $response;
  }

  /**
   * @param array $a2cData Data
   *
   * @return array
   */
  public function productDeleteAction($a2cData) {
    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => [],
    );

    $reportError = function ($e) {
      return $this->_getBridgeError($e);
    };

    chdir(M1_STORE_BASE_DIR . '/wp-admin');
    $this->_safeLoad();

    $this->_initWooCommerceInMultiSiteContext($a2cData['store_id']);

    if (defined('ICL_SITEPRESS_VERSION') && defined('ICL_PLUGIN_INACTIVE') && !ICL_PLUGIN_INACTIVE && class_exists('SitePress')) {
      $this->_wpmlEnabled = true;
    }

    global $wpdb;

    if (!is_array($a2cData['data'])) {
      $a2cData['data'] = ['id' => $a2cData['data']];
    }

    foreach ($a2cData['data'] as $key => $item) {
      try {
        $product                        = null;
        $productId                      = (int)$item['id'];
        $response['result'][$key]['id'] = $productId;

        //WPML support
        if ($this->_wpmlEnabled) {
          $trIdProduct         = apply_filters('wpml_element_trid', null, $productId, 'post_product');
          $productTranslations = apply_filters('wpml_get_element_translations', null, $trIdProduct, 'post_product', false, true);

          foreach ($productTranslations as $translation) {
            do_action('wpml_switch_language', $translation->language_code);
            $product = wc_get_product($translation->element_id);

            if ($product && $product->is_type('variable')) {
              foreach ($product->get_children() as $childId) {
                $child = wc_get_product($childId);

                if (!empty($child)) {
                  $trIdChild = apply_filters('wpml_element_trid', null, $child->get_id(), 'post_product_variation');
                  $child->delete(true);

                  $wpdb->query(
                    $wpdb->prepare("
                      DELETE
                      FROM {$wpdb->prefix}icl_translations
                      WHERE trid=%d",
                      $trIdChild
                    )
                  );
                }
              }
            }

            if ($product) {
              $parentId = $product->get_parent_id();
              $product->delete(true);

              if ($parentId !== 0) {
                wc_delete_product_transients($parentId);
              }
            }
          }

          $wpdb->query(
            $wpdb->prepare("
              DELETE
              FROM {$wpdb->prefix}icl_translations
              WHERE trid=%d",
              $trIdProduct
            )
          );
        } else {
          $product = wc_get_product($productId);

          if ($product && $product->is_type('variable')) {
            foreach ($product->get_children() as $childId) {
              $child = wc_get_product($childId);

              if (!empty($child)) {
                $child->delete(true);
              }
            }
          }

          if ($product) {
            $parentId = $product->get_parent_id();
            $product->delete(true);

            if ($parentId !== 0) {
              wc_delete_product_transients($parentId);
            }
          }
        }

      } catch (Exception $e) {
        $response['result'][$key]['errors'][] = $reportError($e);
      } catch (Throwable $e) {
        $response['result'][$key]['errors'][] = $reportError($e);
      }
    }

    return $response;
  }

  /**
   * @param array $a2cData A2C Data
   *
   * @return array
   */
  public function productAddBatchAction($a2cData)
  {
    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error' => null,
      'result' => []
    );

    $reportError = function ($e) {
      return $this->_getBridgeError($e);
    };

    chdir(M1_STORE_BASE_DIR . '/wp-admin');
    $this->_safeLoad();

    $this->_initWooCommerceInMultiSiteContext($a2cData['store_id']);

    if (defined('ICL_SITEPRESS_VERSION') && defined('ICL_PLUGIN_INACTIVE') && !ICL_PLUGIN_INACTIVE && class_exists('SitePress')) {
      $this->_wpmlEnabled = true;
    }

    foreach ( $a2cData['data'] as $key => $item ) {
      $response['result'][$key]['id'] = null;

      try {
        $product = null;
        $product = $this->_importProductBatch($item);
        $productId = $product->get_id();
        $response['result'][$key]['id'] = $productId;

        //WPML support
        if ($this->_wpmlEnabled) {
          $trIdProduct = apply_filters('wpml_element_trid', null, $productId, 'post_product');
          $productTranslations = apply_filters('wpml_get_element_translations', null, $trIdProduct, 'post_product', false, true);

          foreach ($productTranslations as $translation) {
            wc_delete_product_transients( $translation->element_id );
            wp_cache_delete( 'product-' . $translation->element_id, 'products' );
          }
        } else {
          wc_delete_product_transients( $productId );
          wp_cache_delete( 'product-' . $productId, 'products' );
        }

      } catch (Exception $e) {
        if (isset($product) && $product instanceof WC_Data) {
          $this->_cleanGarbage($product->get_id());
        }

        $response['result'][$key]['errors'][] = $reportError($e);
      } catch (Throwable $e) {
        if (isset($product) && $product instanceof WC_Data) {
          $this->_cleanGarbage($product->get_id());
        }

        $response['result'][$key]['errors'][] = $reportError($e);
      }
    }

    return $response;
  }

  /**
   * @return array
   */
  public function productUpdateAction($a2cData)
  {
    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error' => null,
      'result' => array()
    );

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      $response['result']['product_id'] = $this->_importProduct($a2cData, (int)$a2cData['product_data']['id']);
    } catch (Exception $e) {
      return $reportError($e);
    } catch (Throwable $e) {
      return $reportError($e);
    }

    return $response;
  }

  /**
   * @param array $a2cData A2C Data
   *
   * @return array
   */
  public function productUpdateBatchAction($a2cData)
  {
    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error' => null,
      'result' => []
    );

    $reportError = function ($e) {
      return $this->_getBridgeError($e);
    };

    chdir(M1_STORE_BASE_DIR . '/wp-admin');
    $this->_safeLoad();

    $this->_initWooCommerceInMultiSiteContext($a2cData['store_id']);

    if (defined('ICL_SITEPRESS_VERSION') && defined('ICL_PLUGIN_INACTIVE') && !ICL_PLUGIN_INACTIVE && class_exists('SitePress')) {
      $this->_wpmlEnabled = true;
    }

    foreach ($a2cData['data'] as $key => $item) {
      $response['result'][$key]['id'] = null;

      try {
        $product = null;
        $product = $this->_importProductBatch($item);
        $productId = $product->get_id();
        $response['result'][$key]['id'] = $productId;

        //WPML support
        if ($this->_wpmlEnabled) {
          $trIdProduct         = apply_filters('wpml_element_trid', null, $productId, 'post_product');
          $productTranslations = apply_filters('wpml_get_element_translations', null, $trIdProduct, 'post_product', false, true);

          foreach ($productTranslations as $translation) {
            wc_delete_product_transients($translation->element_id);
            wp_cache_delete('product-' . $translation->element_id, 'products');
          }
        } else {
          wc_delete_product_transients($productId);
          wp_cache_delete('product-' . $productId, 'products');
        }

      } catch (Exception $e) {
        $response['result'][$key]['errors'][] = $reportError($e);
      } catch (Throwable $e) {
        $response['result'][$key]['errors'][] = $reportError($e);
      }
    }

    return $response;
  }

  /**
   * @param array $a2cData   Data
   * @param int   $id        ID
   * @param int   $productId Created product ID
   *
   * @return int
   * @throws Exception
   */
  protected function _importProduct($a2cData, $id = 0, &$productId = 0)
  {
    chdir(M1_STORE_BASE_DIR . '/wp-admin');
    $this->_safeLoad();

    $this->_initWooCommerceInMultiSiteContext($a2cData['store_id']);

    if (isset($a2cData['product_data']['internal_data']['wpml_current_lang_id'])) {
      do_action('wpml_switch_language', $a2cData['product_data']['internal_data']['wpml_current_lang_id']);
    }

    $className = 'WC_Product_' . implode('_', array_map('ucfirst', explode('-', $a2cData['product_data']['type'])));

    if (!class_exists($className)) {
      /* translators: %s: Class name */
      throw new Exception(sprintf(esc_html__('[BRIDGE ERROR]: Class %s not exist!', 'woocommerce'), $className));
    }

    /**
     * @var $product WC_Product
     */
    $product = new $className($id);

    foreach ($a2cData['product_data']['data'] as $productProperty => $productData) {
      if (method_exists($product, 'set_' . $productProperty)) {
        call_user_func_array(array($product, 'set_' . $productProperty), [$productData]);
      }
    }

    $hasSkuUpdate = isset($a2cData['product_data']['meta_data']) && array_key_exists('_sku', $a2cData['product_data']['meta_data']);
    $changeSet = $product->get_changes();
    $metaChanges = [];

    $metaChangesKeys = array_diff(
      array_keys($changeSet),
      [
        'description',
        'short_description',
        'name',
        'parent_id',
        'reviews_allowed',
        'status',
        'menu_order',
        'date_created',
        'date_modified',
        'slug',
        'post_password',
      ]
    );

    foreach ($metaChangesKeys as $key) {
      if ($key === '_sku') {
        $metaChanges[$key] = wc_clean($changeSet[$key]);
      } else {
        $metaChanges[$key] = $changeSet[$key];
      }
    }

    if (isset($a2cData['product_data']['meta_data'])) {
      $metaChanges += $a2cData['product_data']['meta_data'];
    }

    if ($hasSkuUpdate) {
      add_filter('wc_product_pre_has_unique_sku', '__return_true', 10, 3);
    }

    try {
      if (isset($a2cData['product_data']['meta_data']) && array_key_exists('_sku', $a2cData['product_data']['meta_data'])) {
        $product->set_sku($a2cData['product_data']['meta_data']['_sku']);
        unset($metaChanges['_sku']);
        unset($a2cData['product_data']['meta_data']['_sku']);
      }

      if (isset($changeSet['description'])) {
        remove_filter('content_save_pre', 'wp_filter_post_kses');
      }

      $product->save();
    } finally {
      if ($hasSkuUpdate) {
        remove_filter('wc_product_pre_has_unique_sku', '__return_true', 10);
      }
    }

    $productId = $product->get_id();

    if (isset($a2cData['product_data']['meta_data'])) {
      foreach ($a2cData['product_data']['meta_data'] as $metaKey => $metaData) {
        if ($metaKey === '_product_attributes') {
          $this->_readAttributes($product, maybe_unserialize($metaData));
        } else {
          if (is_null($metaData)) {
            delete_post_meta($productId, $metaKey);
          } else {
            update_post_meta($productId, $metaKey, $metaData);
          }
        }
      }
    }

    if (isset($a2cData['product_data']['terms_data'])) {
      $this->_setProductTerms($productId, $a2cData['product_data']['terms_data']);
    }

    if ($this->_wpmlEnabled) {
      $this->_wpmlSync($product, $a2cData, $metaChanges);
    } elseif ($this->_polylangEnabled) {
      $this->_polylangSync($product, $a2cData, $id);
    }

    return $productId;
  }

  /**
   * Reads attributes data and sets them to the product.
   *
   * @param int   $productId Product ID
   * @param array $termsData Terms data
   *
   * @return void
   */
  protected function _setProductTerms($productId, array $termsData)
  {
    foreach ($termsData as $termName => $terms) {
      $termIds = [];

      foreach (array_column($terms, 'name') as $termId) {
        if (!empty($termId)) {
          $termIds[] = $termId;
        }
      }

      $termIds = array_values(array_unique($termIds));
      $append = false;

      if (isset($terms[0]['append'])) {
        $append = (bool)$terms[0]['append'];
      }

      if (empty($termIds)) {
        continue;
      }

      if ($append) {
        wp_set_post_terms($productId, $termIds, $termName, true);
      } else {
        wp_delete_object_term_relationships($productId, $termName);
        wp_set_post_terms($productId, $termIds, $termName);
      }
    }
  }

  /**
   * Gets Polylang translation ID for the post by language code.
   *
   * @param int    $postId   Post ID
   * @param string $langCode Lang code
   *
   * @return int
   */
  protected function _getPolylangTranslationId($postId, $langCode)
  {
    $translationId = 0;

    if ($langCode) {
      if (function_exists('pll_get_post')) {
        $translationId = (int)pll_get_post($postId, $langCode);

        if ($translationId) {
          return $translationId;
        }

        if (function_exists('pll_get_post_translations')) {
          $translations = pll_get_post_translations($postId);

          if (is_array($translations) && isset($translations[$langCode])) {
            return (int)$translations[$langCode];
          }
        }
      }
    }

    return $translationId;
  }

  /**
   * Initializes Polylang duplication compatibility by removing term setting on duplication.
   * @return void
   */
  private function _initPolylangDuplicateProduct()
  {
    if (class_exists('PLLWC_Admin_Product_Duplicate') && function_exists('PLL')) {
      $pll = PLL();

      if ($pll && isset($pll->posts)) {
        // Mirrors Polylang-WC admin duplication behavior (admin/admin-product-duplicate.php).
        remove_action('set_object_terms', [$pll->posts, 'set_object_terms']);
      }
    }
  }

  /**
   * Gets Polylang model instance if Polylang is active and model is accessible.
   * @return object|null
   */
  protected function _getPolylangModel()
  {
    $model = null;
    $pll = null;

    if (function_exists('PLL')) {
      $pll = PLL();
    }

    if ($pll && isset($pll->model)) {
      $model = $pll->model;
    }

    return $model;
  }

  /**
   * @param WC_Product $product  WC Product
   * @param array      $a2cData  Data
   * @param int|null   $sourceId Source ID
   *
   * @return void
   * @throws Exception
   */
  protected function _polylangSync(WC_Product $product, $a2cData, $sourceId = 0)
  {
    $polylangData = $this->_initPolylangData($a2cData);
    $productId = $product->get_id();
    $model = $this->_getPolylangModel();
    $postModel = null;
    $termModel = null;

    if (is_object($model)) {
      $postModel = isset($model->post) ? $model->post : null;
      $termModel = isset($model->term) ? $model->term : null;
    }

    if ($product->get_type() === 'variation') {
      $this->_polylangSyncVariations($product, $polylangData, $postModel, $model);
      return;
    }

    $activeLanguages = $this->_getPolylangLanguagesList($model);

    if ($activeLanguages) {
      $this->_polyLangTranslateTerms($a2cData, $activeLanguages);
    }

    if (!$polylangData['langCode'] && !$polylangData['onlyTranslateTo']) {
      $this->_handlePolylangWithoutTranslation($product, $productId, $postModel, $model, $termModel);
      return;
    }

    $defaultLangPrId = $sourceId > 0 ? $sourceId : $productId;
    $createdIds = array();

    try {
      $skipSetLang = $this->_isSkipPolylangLanguageSet($sourceId, $productId, $polylangData['langCode'], $postModel);

      if ($polylangData['langCode'] && !$skipSetLang) {
        $this->_polylangSetLanguage($productId, $polylangData['langCode'], $postModel);
        $this->_setPolylangLanguageForTerm($productId, $polylangData['langCode'], $postModel, $model);
      }

      $this->_savePolylangProductTranslation($sourceId, $productId, $polylangData['langCode'], $postModel);

      $termLangCode = $this->_polylangGetTermLanguage($polylangData['langCode'], $skipSetLang, $productId, $postModel);

      if ($termLangCode) {
        $this->_setPolylangLanguageForProductTerms($product, $termLangCode, $termModel);
      }

      $langList = $this->_normalizeLanguageList($polylangData['onlyTranslateTo']);
      $productTranslations = $this->_preparePolylangProductTranslations(
        $product,
        $defaultLangPrId,
        $langList,
        $polylangData['langCode'],
        $postModel,
        $createdIds
      );

      if (empty($productTranslations)) {
        $productTranslations = $this->_getOrInitializePolylangTranslations($defaultLangPrId, $postModel);
      }

      if ($polylangData['langCode'] && $productId !== $defaultLangPrId && !isset($productTranslations[$polylangData['langCode']])) {
        $productTranslations[$polylangData['langCode']] = $productId;
      }

      $termsData = $polylangData['termsData'];

      if (empty($termsData)) {
        $termsData = $this->_getPolylangProductTermsData($defaultLangPrId);
      }

      if ($termsData && $productTranslations) {
        $this->_syncPolylangProductTerms($productTranslations, $termsData, $termModel);
      }

      if ($product->get_type() === 'variable') {
        $this->_polylangSyncAttributes($product, $polylangData, $postModel, $termModel, $model);
      }

      if ($skipSetLang) {
        $this->_rollbackPolylangBaseProtectedData($defaultLangPrId, $a2cData, $postModel);
      }
    } catch (Exception $e) {
      if ($createdIds) {
        $a2cData['product_data']['internal_data']['polylang_created_ids'] = $createdIds;
        $this->_rollbackProtectedData($productId, $a2cData, null);
      }
      throw $e;
    }
  }

  /**
   * Sync Polylang translations for product variations
   *
   * @param WC_Product  $variation    Variation product
   * @param array       $polylangData Polylang data
   * @param object|null $postModel    Polylang post model
   * @param object|null $model        Polylang main model
   *
   * @return void
   */
  protected function _polylangSyncVariations(WC_Product $variation, $polylangData, $postModel, $model)
  {
    $variationId = $variation->get_id();
    $parentId = $variation->get_parent_id();
    $languages = $this->_getPolylangLanguagesList($model);

    if (!$parentId) {
      return;
    }

    $parentTranslations = $this->_polylangGetTranslations($parentId, $postModel);

    if (empty($parentTranslations)) {
      $langCode = $polylangData['langCode'];

      if ($langCode) {
        $this->_polylangSetLanguage($variationId, $langCode, $postModel);
      }

      return;
    }

    $variationLangCode = $polylangData['langCode'];

    if (!$variationLangCode) {
      $variationLangCode = $this->_polylangGetLanguage($variationId, $postModel);
    }

    if (!$variationLangCode) {
      $variationLangCode = $this->_polylangGetLanguage($parentId, $postModel);
    }

    if (!$variationLangCode && function_exists('pll_default_language')) {
      $variationLangCode = pll_default_language('slug');
    }

    if ($variationLangCode) {
      $this->_polylangSetLanguage($variationId, $variationLangCode, $postModel);
    }

    $variationTranslations = $this->_polylangGetTranslations($variationId, $postModel);

    if (empty($variationTranslations) && $variationLangCode) {
      $variationTranslations = array($variationLangCode => $variationId);
    }

    $langList = $this->_normalizeLanguageList($polylangData['onlyTranslateTo']);

    if (empty($langList)) {
      $langList = array_keys($parentTranslations);
    }

    foreach ($langList as $langCode) {
      if (isset($variationTranslations[$langCode])) {
        $trVariationId = $variationTranslations[$langCode];

        if ($trVariationId != $variationId) {
          $trVariation = wc_get_product($trVariationId);

          if ($trVariation instanceof WC_Product) {
            $this->_polylangSyncVariationAttributes($variation, $trVariation, $langCode, $model, $languages);
            $trVariation->save();
          }
        }

        continue;
      }

      if ($langCode === $variationLangCode) {
        continue;
      }

      $trParentId = isset($parentTranslations[$langCode]) ? $parentTranslations[$langCode] : null;

      if (!$trParentId) {
        continue;
      }

      $trVariationId = $this->_duplicatePolylangVariation($variation, $trParentId, $langCode, $postModel);

      if ($trVariationId) {
        $variationTranslations[$langCode] = $trVariationId;

        $trVariation = wc_get_product($trVariationId);

        if ($trVariation instanceof WC_Product) {
          $this->_polylangSyncVariationAttributes($variation, $trVariation, $langCode, $model, $languages);
          $trVariation->save();
        }
      }
    }

    if (count($variationTranslations) > 1) {
      $this->_polylangSaveTranslations($variationId, $variationTranslations, $postModel);
    }
  }


  /**
   * Sync Polylang translations for product variations
   *
   * @param WC_Product  $parentProduct Variation product
   * @param array       $polylangData  Polylang data
   * @param object|null $postModel     Polylang post model
   * @param object|null $termModel     Polylang term model
   * @param object|null $model         Polylang main model
   *
   * @return void
   */
  protected function _polylangSyncAttributes(WC_Product $parentProduct, $polylangData, $postModel, $termModel, $model)
  {
    $parentId = $parentProduct->get_id();

    if ($parentId === 0) {
      return;
    }

    $parentTranslations = $this->_polylangGetTranslations($parentId, $postModel);

    if ($parentTranslations === [] || $parentTranslations === null) {
      if ($polylangData['langCode']) {
        $this->_polylangSetLanguage($parentId, $polylangData['langCode'], $postModel);
      }

      return;
    }

    $defaultLangCode = null;

    if (function_exists('pll_default_language')) {
      $defaultLangCode = pll_default_language('slug');
    } elseif ($model && method_exists($model, 'get_default_language')) {
      $langObj = $model->get_default_language();

      if ($langObj && isset($langObj->slug)) {
        $defaultLangCode = $langObj->slug;
      }
    }

    if ($defaultLangCode === null || $defaultLangCode === '') {
      return;
    }

    if (isset($parentTranslations[$defaultLangCode])) {
      $defaultParentId = (int)$parentTranslations[$defaultLangCode];
    } else {
      return;
    }

    $defaultParent = wc_get_product($defaultParentId);

    if ($defaultParent instanceof WC_Product) {
      $attributes = $defaultParent->get_attributes();
    } else {
      return;
    }

    if ($attributes === [] || $attributes === null) {
      return;
    }

    $activeLanguages = $this->_getPolylangLanguagesList($model);

    if ($activeLanguages) {
      /** @var WC_Product_Attribute $attribute */
      foreach ($attributes as $attribute) {
        if ($attribute->is_taxonomy()) {
          $terms = $attribute->get_terms();
          $termIds = [];

          if ($terms) {
            foreach ($terms as $term) {
              $termIds[] = (int)$term->term_id;
            }
          }

          $termIds = array_values(array_unique($termIds));

          if ($termIds) {
            $this->_polylangTranslateTaxonomy($termIds, $attribute->get_taxonomy(), $activeLanguages, $termModel, $defaultLangCode);
          }
        }
      }
    }

    if (class_exists('PLLWC_Products') && method_exists('PLLWC_Products', 'maybe_translate_attributes')) {
      $attributes = PLLWC_Products::maybe_translate_attributes($attributes, $defaultLangCode);
    }

    $defaultParent->set_attributes($attributes);
    $defaultParent->save();

    foreach ($parentTranslations as $trLangCode => $trParentId) {
      $trParentId = (int)$trParentId;

      if ($trLangCode === $defaultLangCode || $trParentId === 0) {
        continue;
      }

      $trParent = wc_get_product($trParentId);

      if ($trParent instanceof WC_Product) {
        $trAttributes = $attributes;

        if (class_exists('PLLWC_Products') && method_exists('PLLWC_Products', 'maybe_translate_attributes')) {
          $trAttributes = PLLWC_Products::maybe_translate_attributes($attributes, $trLangCode);
        }

        $trParent->set_attributes($trAttributes);
        $trParent->save();
      }
    }
  }

  /**
   * Duplicate a variation for Polylang translation
   *
   * @param WC_Product  $variation       Source variation
   * @param int         $targetParentId  Target parent product ID
   * @param string      $langCode        Target language code
   * @param object|null $postModel       Polylang post model
   *
   * @return int
   */
  protected function _duplicatePolylangVariation(WC_Product $variation, $targetParentId, $langCode, $postModel)
  {
    $duplicateId = 0;

    if (!class_exists('WC_Product_Variation')) {
      return $duplicateId;
    }

    $targetParent = wc_get_product($targetParentId);

    if (!$targetParent || $targetParent->get_type() !== 'variable') {
      return $duplicateId;
    }

    $newVariation = new WC_Product_Variation();
    $newVariation->set_parent_id($targetParentId);

    $newVariation->set_sku($variation->get_sku());
    $newVariation->set_regular_price($variation->get_regular_price());
    $newVariation->set_sale_price($variation->get_sale_price());
    $newVariation->set_date_on_sale_from($variation->get_date_on_sale_from());
    $newVariation->set_date_on_sale_to($variation->get_date_on_sale_to());
    $newVariation->set_manage_stock($variation->get_manage_stock());
    $newVariation->set_stock_quantity($variation->get_stock_quantity());
    $newVariation->set_stock_status($variation->get_stock_status());
    $newVariation->set_backorders($variation->get_backorders());
    $newVariation->set_weight($variation->get_weight());
    $newVariation->set_length($variation->get_length());
    $newVariation->set_width($variation->get_width());
    $newVariation->set_height($variation->get_height());
    $newVariation->set_tax_class($variation->get_tax_class());
    $newVariation->set_shipping_class_id($variation->get_shipping_class_id());
    $newVariation->set_image_id($variation->get_image_id());
    $newVariation->set_virtual($variation->get_virtual());
    $newVariation->set_downloadable($variation->get_downloadable());
    $newVariation->set_description($variation->get_description());
    $newVariation->set_status($variation->get_status());

    $attributes = $variation->get_attributes();

    if ($attributes) {
      $newVariation->set_attributes($attributes);
    }

    $duplicateId = $newVariation->save();

    if ($duplicateId) {
      if (function_exists('pll_set_post_language')) {
        pll_set_post_language($duplicateId, $langCode);
      } elseif ($postModel) {
        $postModel->set_language($duplicateId, $langCode);
      }

      if (function_exists('wc_delete_product_transients')) {
        wc_delete_product_transients($targetParentId);
      }
    }

    return $duplicateId;
  }

  /**
   * Sync variation attributes to translation
   *
   * @param WC_Product  $variation   Source variation
   * @param WC_Product  $trVariation Translated variation
   * @param string      $langCode    Target language code
   * @param object|null $model       Polylang main model
   * @param array       $languages   Polylang languages
   *
   * @return void
   */
  protected function _polylangSyncVariationAttributes(WC_Product $variation, WC_Product $trVariation, $langCode, $model, array $languages = array())
  {
    $attributes = $variation->get_attributes();

    if ($attributes) {
      $termModel = null;

      if (is_object($model) && isset($model->term)) {
        $termModel = $model->term;
      }

      $termIdsByTaxonomy = [];

      if ($languages) {
        foreach ($attributes as $attributeName => $attributeValue) {
          if (taxonomy_exists($attributeName)) {
            $term = get_term_by('slug', $attributeValue, $attributeName);

            if ($term && !is_wp_error($term)) {
              if (!isset($termIdsByTaxonomy[$attributeName])) {
                $termIdsByTaxonomy[$attributeName] = [];
              }

              $termIdsByTaxonomy[$attributeName][] = (int)$term->term_id;
            }
          }
        }
      }

      if ($termIdsByTaxonomy) {
        foreach ($termIdsByTaxonomy as $taxonomy => $termIds) {
          $termIds = array_values(array_unique($termIds));

          if ($termIds) {
            $this->_polylangTranslateTaxonomy($termIds, $taxonomy, $languages, $termModel, $langCode);
          }
        }
      }

      if (class_exists('PLLWC_Products')
        && method_exists('PLLWC_Products', 'maybe_translate_attributes')
        && function_exists('pll_is_translated_taxonomy')
      ) {
        $translatedAttributes = PLLWC_Products::maybe_translate_attributes($attributes, $langCode);
        $trVariation->set_attributes($translatedAttributes);

        if ($imageId = $variation->get_image_id()) {
          $trVariation->set_image_id($imageId);
        }

        return;
      }

      $translatedAttributes = array();

      foreach ($attributes as $attributeName => $attributeValue) {
        if (taxonomy_exists($attributeName)) {
          $term = get_term_by('slug', $attributeValue, $attributeName);

          if ($term && !is_wp_error($term)) {
            $translatedTermId = $this->_polylangGetTranslatedTermId($term->term_id, $langCode, $termModel);

            if (!$translatedTermId) {
              $translatedTermId = $this->_createPolylangTermTranslation($term->term_id, $langCode, $attributeName, $termModel);
            }

            if ($translatedTermId) {
              $translatedTerm = get_term_by('id', $translatedTermId, $attributeName);

              if ($translatedTerm && !is_wp_error($translatedTerm)) {
                $translatedAttributes[$attributeName] = $translatedTerm->slug;
              } else {
                $translatedAttributes[$attributeName] = $attributeValue;
              }

              $trParentId = $trVariation->get_parent_id();

              if ($trParentId) {
                wp_set_object_terms($trParentId, (int)$translatedTermId, $attributeName, true);
              }
            } else {
              $translatedAttributes[$attributeName] = $attributeValue;
            }
          } else {
            $translatedAttributes[$attributeName] = $attributeValue;
          }
        } else {
          $translatedAttributes[$attributeName] = $attributeValue;
        }
      }

      $trVariation->set_attributes($translatedAttributes);

      if ($imageId = $variation->get_image_id()) {
        $trVariation->set_image_id($imageId);
      }
    }
  }

  /**
   * Get translated term ID for Polylang
   *
   * @param int         $termId    Term ID
   * @param string      $langCode  Target language code
   * @param object|null $termModel Polylang term model
   *
   * @return int
   */
  protected function _polylangGetTranslatedTermId($termId, $langCode, $termModel)
  {
    $translatedId = 0;

    if (function_exists('pll_get_term')) {
      $translatedId = pll_get_term($termId, $langCode);
    } elseif ($termModel && method_exists($termModel, 'get_translation')) {
      $translatedId = $termModel->get_translation($termId, $langCode);
    } elseif ($termModel && method_exists($termModel, 'get_translations')) {
      $translations = $termModel->get_translations($termId);

      if (isset($translations[$langCode])) {
        $translatedId = $translations[$langCode];
      }
    }

    return (int)$translatedId;
  }

  /**
   * Initialize Polylang data from product data array
   *
   * @param array $a2cData A2C Data
   *
   * @return array
   */
  private function _initPolylangData(array $a2cData)
  {
    $internalData = array();
    $termsData = array();

    if (isset($a2cData['product_data']['internal_data']) && is_array($a2cData['product_data']['internal_data'])) {
      $internalData = $a2cData['product_data']['internal_data'];
    }

    if (isset($a2cData['product_data']['terms_data']) && is_array($a2cData['product_data']['terms_data'])) {
      $termsData = $a2cData['product_data']['terms_data'];
    }

    return array(
      'langCode' => isset($internalData['polylang_lang_code']) ? $internalData['polylang_lang_code'] : null,
      'onlyTranslateTo' => isset($internalData['polylang_only_translate_to']) ? $internalData['polylang_only_translate_to'] : null,
      'termsData' => $termsData,
    );
  }

  /**
   * @param int $productId Product ID
   *
   * @return array
   */
  protected function _getPolylangProductTermsData($productId)
  {
    $termsData = array();
    $taxonomies = array('product_cat', 'product_tag');

    foreach ($taxonomies as $taxonomy) {
      if ($taxonomy === 'product_tag') {
        $terms = wp_get_post_terms($productId, $taxonomy);

        if (is_wp_error($terms)) {
          continue;
        }

        if ($terms) {
          $items = array();

          foreach ($terms as $term) {
            if (isset($term->name) && $term->name !== '') {
              $items[] = array('name' => $term->name);
            }
          }

          if ($items) {
            $termsData[$taxonomy] = $items;
          }
        }
      } else {
        $termIds = wp_get_post_terms($productId, $taxonomy, array('fields' => 'ids'));

        if (is_wp_error($termIds)) {
          continue;
        }

        if ($termIds) {
          $items = array();

          foreach ($termIds as $termId) {
            $items[] = array('name' => (int)$termId);
          }

          if ($items) {
            $termsData[$taxonomy] = $items;
          }
        }
      }
    }

    return $termsData;
  }

  /**
   * Normalize language list to array format
   *
   * @param array|string $languages Language or languages list
   *
   * @return array
   */
  private function _normalizeLanguageList($languages)
  {
    if (!$languages) {
      return array();
    }

    return is_array($languages) ? $languages : array($languages);
  }

  /**
   * Get or initialize translations with fallback to base language
   *
   * @param int         $postId    Post ID
   * @param object|null $postModel Polylang post model
   *
   * @return array
   */
  private function _getOrInitializePolylangTranslations($postId, $postModel)
  {
    $translations = $this->_polylangGetTranslations($postId, $postModel);

    if (!empty($translations)) {
      return $translations;
    }

    $baseLang = $this->_polylangGetLanguage($postId, $postModel);
    if ($baseLang) {
      return array($baseLang => $postId);
    }

    return array();
  }

  /**
   * Determine if language set should be skipped
   *
   * @param int         $sourceId  Source product ID
   * @param int         $productId Current product ID
   * @param string|null $langCode  Language code
   * @param object|null $postModel Polylang post model
   *
   * @return bool
   */
  private function _isSkipPolylangLanguageSet($sourceId, $productId, $langCode, $postModel)
  {
    if ($sourceId <= 0 || !$langCode) {
      return false;
    }

    $sourceLang = $this->_polylangGetLanguage($sourceId, $postModel);
    $translationId = $this->_getPolylangTranslationId($sourceId, $langCode);

    // Reset if source language differs and translation ID equals source ID
    if ($sourceLang && $langCode !== $sourceLang && $translationId === $sourceId) {
      $translationId = 0;
    }

    // Skip if this is the first time and product equals source
    return $translationId === 0 && $productId === $sourceId;
  }

  /**
   * Save product translation for new language
   *
   * @param int         $sourceId  Source product ID
   * @param int         $productId Current product ID
   * @param string|null $langCode  Language code
   * @param object|null $postModel
   *
   * @return void
   */
  private function _savePolylangProductTranslation($sourceId, $productId, $langCode, $postModel)
  {
    if ($sourceId <= 0 || $productId === $sourceId || !$langCode) {
      return;
    }

    $sourceLang = $this->_polylangGetLanguage($sourceId, $postModel);
    if (!$sourceLang) {
      return;
    }

    $translations = $this->_polylangGetTranslations($sourceId, $postModel);

    if ($translations) {
      $translations[$langCode] = $productId;
    } else {
      $translations = array(
        $sourceLang => $sourceId,
        $langCode => $productId,
      );
    }

    $this->_polylangSaveTranslations($sourceId, $translations, $postModel);
  }

  /**
   * Process language variants and create duplicates as needed
   *
   * @param WC_Product  $product         WC Product
   * @param int         $defaultLangPrId Default language product ID
   * @param array       $langList        Language list to process
   * @param string|null $langCode        Current product language code
   * @param object|null $postModel       Polylang post model
   * @param array       $createdIds      Reference to array for storing created product IDs for rollback
   *
   * @return array
   */
  private function _preparePolylangProductTranslations($product, $defaultLangPrId, $langList, $langCode, $postModel, &$createdIds)
  {
    if (!$langList) {
      return array();
    }

    $productId = $product->get_id();
    $translations = $this->_getOrInitializePolylangTranslations($defaultLangPrId, $postModel);

    foreach ($langList as $langItem) {
      if (isset($translations[$langItem])) {
        continue;
      }

      if ($langItem === $langCode && $productId !== $defaultLangPrId) {
        $translations[$langItem] = $productId;
      } else {
        $duplicatePrId = $this->_duplicatePolylangProduct($product, $langItem, $postModel);

        if ($duplicatePrId) {
          $createdIds[] = $duplicatePrId;
          $translations[$langItem] = $duplicatePrId;
        }
      }
    }

    $this->_polylangSaveTranslations($defaultLangPrId, $translations, $postModel);

    return $translations;
  }

  /**
   * Handle Polylang sync when no language code is set
   *
   * @param WC_Product  $product   Product object
   * @param int         $productId Product ID
   * @param object|null $postModel Polylang post model
   * @param object|null $model     Polylang main model
   * @param object|null $termModel Polylang term model
   *
   * @return void
   */
  private function _handlePolylangWithoutTranslation($product, $productId, $postModel, $model, $termModel)
  {
    $termLangCode = $this->_polylangGetTermLanguage(null, false, $productId, $postModel);

    if ($termLangCode) {
      $this->_setPolylangLanguageForTerm($productId, $termLangCode, $postModel, $model);
      $this->_setPolylangLanguageForProductTerms($product, $termLangCode, $termModel);
    }
  }

  /**
   * Translate product terms based on active languages and product language code
   *
   * @param array $a2cData Data
   * @param array $languages Active languages
   *
   * @return void
   */
  protected function _polyLangTranslateTerms(array $a2cData, array $languages)
  {
    $model = $this->_getPolylangModel();
    $activeLanguages = $languages;
    $internalData = [];
    $productLangCode = null;

    if (isset($a2cData['product_data']['internal_data']) && is_array($a2cData['product_data']['internal_data'])) {
      $internalData = $a2cData['product_data']['internal_data'];
    }

    if (isset($internalData['polylang_lang_code'])) {
      $productLangCode = $internalData['polylang_lang_code'];
    }

    if ($productLangCode === null || $productLangCode === '') {
      if (function_exists('pll_default_language')) {
        $defaultLang = pll_default_language('slug');

        if ($defaultLang) {
          $productLangCode = $defaultLang;
        }
      }
    }

    if ($activeLanguages && $model && isset($model->term)) {
      if (isset($a2cData['product_data']['terms_data']['product_cat'])) {
        $termNames = array_unique(array_column($a2cData['product_data']['terms_data']['product_cat'], 'name'));

        if ($termNames) {
          $this->_polylangTranslateTaxonomy($termNames, 'product_cat', $activeLanguages, $model->term, $productLangCode);
        }
      }

      if (isset($a2cData['product_data']['terms_data']['product_tag'])) {
        $termNames = array_unique(array_column($a2cData['product_data']['terms_data']['product_tag'], 'name'));

        if ($termNames) {
          $this->_polylangTranslateTaxonomy($termNames, 'product_tag', $activeLanguages, $model->term, $productLangCode);
        }
      }
    }
  }

  /**
   * Get Polylang language for a post
   *
   * @param int         $postId    Post ID
   * @param string|null $langCode  Language code
   * @param object|null $postModel Polylang post model
   *
   * @return void
   */
  protected function _polylangSetLanguage($postId, $langCode, $postModel)
  {
    if ($langCode && function_exists('pll_set_post_language')) {
      pll_set_post_language($postId, $langCode);
    } elseif ($langCode && $postModel) {
      $postModel->set_language($postId, $langCode);
    }
  }

  /**
   * Get Polylang language for a post
   *
   * @param int         $postId    Post ID
   * @param string|null $langCode  Language code
   * @param object|null $postModel Polylang post model
   * @param object|null $model     Polylang main model
   *
   * @return void
   */
  protected function _setPolylangLanguageForTerm($postId, $langCode, $postModel, $model)
  {
    if ($langCode) {
      $currentLang = $this->_polylangGetLanguage($postId, $postModel);

      if ($currentLang === $langCode) {
        return;
      }

      if ($model) {
        $langObj = $model->get_language($langCode);

        if ($langObj && isset($langObj->term_id)) {
          if (function_exists('taxonomy_exists') && taxonomy_exists('language')) {
            wp_set_object_terms($postId, (int)$langObj->term_id, 'language');
          }
        }
      }
    }
  }

  /**
   * Set Polylang language for product terms
   *
   * @param WC_Product  $product   WC Product
   * @param string|null $langCode  Language code
   * @param object|null $termModel Polylang term model
   *
   * @return void
   */
  protected function _setPolylangLanguageForProductTerms(WC_Product $product, $langCode, $termModel)
  {
    if ($langCode) {
      $taxonomies = ['product_cat', 'product_tag'];
      $attributes = $product->get_attributes();

      foreach ($attributes as $attribute) {
        if (is_object($attribute) && method_exists($attribute, 'is_taxonomy') && $attribute->is_taxonomy()) {
          $taxonomies[] = $attribute->get_taxonomy();
        }
      }

      $taxonomies = array_unique($taxonomies);
      $productId = $product->get_id();

      foreach ($taxonomies as $taxonomy) {
        $termIds = wp_get_post_terms($productId, $taxonomy, ['fields' => 'ids']);

        if (is_wp_error($termIds)) {
          continue;
        }

        if ($termIds) {
          foreach ($termIds as $termId) {
            $this->_setPolylangTermLanguage((int)$termId, $langCode, $termModel);
          }
        }
      }
    }
  }

  /**
   * Map product terms to corresponding terms in the target language
   *
   * @param array       $translations Language translations array
   * @param array       $termsData    Terms data array
   * @param object|null $termModel    Polylang term model
   *
   * @return void
   */
  protected function _syncPolylangProductTerms(array $translations, array $termsData, $termModel)
  {
    if ($translations && $termsData) {
      $filteredTermsData = [];
      $nonTranslatedTerms = [];

      foreach ($termsData as $taxonomy => $items) {
        $hasValues = false;

        foreach ($items as $item) {
          if (!empty($item['name'])) {
            $hasValues = true;
            break;
          }
        }

        if ($hasValues) {
          $filteredTermsData[$taxonomy] = $items;

          if (isset($items[0]['all_lang']) && $items[0]['all_lang'] === false) {
            $nonTranslatedTerms[$taxonomy] = $items;
          }
        }
      }

      if ($filteredTermsData) {
        foreach ($translations as $langCode => $translationId) {
          $termsToMap = $filteredTermsData;

          if ($nonTranslatedTerms) {
            foreach ($nonTranslatedTerms as $taxonomy => $items) {
              if (isset($termsToMap[$taxonomy])) {
                unset($termsToMap[$taxonomy]);
              }
            }
          }

          if ($termsToMap) {
            $mappedTerms = $this->_mapPolylangTerms($termsToMap, $langCode, $termModel);

            if ($nonTranslatedTerms) {
              $mappedTerms = array_merge($mappedTerms, $nonTranslatedTerms);
            }
          } else {
            $mappedTerms = $filteredTermsData;
          }

          $this->_setProductTerms($translationId, $mappedTerms);
        }
      }
    }
  }

  /**
   * Map product terms to corresponding terms in the target language
   *
   * @param int         $termId    Term ID
   * @param string|null $langCode  Language code
   * @param object|null $termModel Polylang term model
   *
   * @return void
   */
  protected function _setPolylangTermLanguage($termId, $langCode, $termModel)
  {
    if ($langCode) {
      $currentLang = null;

      if (function_exists('pll_get_term_language')) {
        $currentLang = pll_get_term_language($termId);
      } elseif ($termModel) {
        $langObj = $termModel->get_language($termId);

        if ($langObj && isset($langObj->slug)) {
          $currentLang = $langObj->slug;
        }
      }

      if (empty($currentLang)) {
        if (function_exists('pll_set_term_language')) {
          pll_set_term_language($termId, $langCode);
        } elseif ($termModel) {
          $termModel->set_language($termId, $langCode);
        }
      }
    }
  }

  /**
   * Get language code for product terms with multiple fallback options
   *
   * @param string|null $langCode    Language code
   * @param bool        $skipSetLang Whether to skip setting language for the product
   * @param int         $productId   Product ID
   * @param object|null $postModel   Polylang post model
   *
   * @return string|null
   */
  protected function _polylangGetTermLanguage($langCode, $skipSetLang, $productId, $postModel = null)
  {
    $termLangCode = null;
    $model = null;

    if ($postModel === null) {
      $model = $this->_getPolylangModel();

      if ($model && isset($model->post)) {
        $postModel = $model->post;
      }
    }

    if ($langCode && !$skipSetLang) {
      $termLangCode = $langCode;
    }

    if (empty($termLangCode) && $postModel) {
      $termLangCode = $this->_polylangGetLanguage($productId, $postModel);
    }

    if (empty($termLangCode)) {
      if (function_exists('pll_default_language')) {
        $termLangCode = pll_default_language('slug');
      } elseif ($model && method_exists($model, 'get_default_language')) {
        $langObj = $model->get_default_language();

        if ($langObj && isset($langObj->slug)) {
          $termLangCode = $langObj->slug;
        }
      }
    }

    return $termLangCode;
  }

  /**
   * Get Polylang language for a post
   *
   * @param int         $postId    Post ID
   * @param object|null $postModel Polylang post model
   *
   * @return string|null
   */
  protected function _polylangGetLanguage($postId, $postModel)
  {
    $lang = null;

    if (function_exists('pll_get_post_language')) {
      $lang = pll_get_post_language($postId);
    } elseif ($postModel) {
      $langObj = $postModel->get_language($postId);

      if ($langObj && isset($langObj->slug)) {
        $lang = $langObj->slug;
      }
    }

    return $lang;
  }

  /**
   * Get Polylang translations for a post
   *
   * @param int         $postId    Post ID
   * @param object|null $postModel Polylang post model
   *
   * @return array
   */
  protected function _polylangGetTranslations($postId, $postModel)
  {
    $translations = [];

    if (function_exists('pll_get_post_translations')) {
      $translations = pll_get_post_translations($postId);
    } elseif ($postModel) {
      $translations = $postModel->get_translations($postId);
    }

    if (is_array($translations)) {
      return $translations;
    }

    return [];
  }

  /**
   * Save Polylang translations for a post
   *
   * @param int         $sourceId     Post ID of the source product
   * @param array       $translations Translations array in format [lang_code => post_id]
   * @param object|null $postModel    Polylang post model
   *
   * @return void
   */
  protected function _polylangSaveTranslations($sourceId, array $translations, $postModel)
  {
    if ($translations) {
      if (function_exists('pll_save_post_translations')) {
        pll_save_post_translations($translations);
      } elseif ($postModel) {
        $postModel->save_translations($sourceId, $translations);
      }
    }
  }

  /**
   * Duplicate product for Polylang translation
   *
   * @param WC_Product  $product   Product
   * @param string      $langCode  Language code
   * @param object|null $postModel Post model
   *
   * @return int
   */
  protected function _duplicatePolylangProduct(WC_Product $product, $langCode, $postModel)
  {
    $duplicatePrId = 0;
    $usePllWC = false;
    $pllWCDuplicator = null;

    if ($langCode && class_exists('WC_Admin_Duplicate_Product')) {
      $this->_initPolylangDuplicateProduct();

      if (class_exists('PLLWC_Admin_Product_Duplicate')) {
        $usePllWC = true;
        $pllWCDuplicator = new PLLWC_Admin_Product_Duplicate();
      }

      $duplicator = new WC_Admin_Duplicate_Product();
      $productDuplicate = $duplicator->product_duplicate($product);

      if ($productDuplicate instanceof WC_Product) {
        if ($usePllWC) {
          $pllWCDuplicator->product_duplicate($productDuplicate, $product);
        }

        $productDuplicate->set_name($product->get_name());
        $productDuplicate->set_description($product->get_description());
        $productDuplicate->set_short_description($product->get_short_description());
        $productDuplicate->set_status($product->get_status());
        $productDuplicate->save();

        $duplicatePrId = $productDuplicate->get_id();

        if ($duplicatePrId) {
          $origSku = $product->get_sku();

          if ($origSku !== null && $origSku !== '') {
            add_filter('wc_product_pre_has_unique_sku', '__return_true', 10, 3);

            try {
              $productDuplicate->set_sku($origSku);
              $productDuplicate->save();
            } finally {
              remove_filter('wc_product_pre_has_unique_sku', '__return_true', 10);
            }
          }

          if (function_exists('pll_set_post_language')) {
            pll_set_post_language($duplicatePrId, $langCode);
          } elseif ($postModel) {
            $postModel->set_language($duplicatePrId, $langCode);
          }
        }
      }
    }

    return $duplicatePrId;
  }

  /**
   * Map product terms to corresponding terms in the target language
   *
   * @param array       $termsData Terms data
   * @param string|null $langCode  Lang code
   * @param object|null $termModel Term model
   *
   * @return array
   */
  protected function _mapPolylangTerms(array $termsData, $langCode, $termModel = null)
  {
    $result = $termsData;

    if ($langCode) {
      $result = [];

      foreach ($termsData as $taxonomy => $terms) {
        $mapped = [];

        foreach ($terms as $term) {
          $termId = 0;
          $foundTermId = 0;

          if ($taxonomy === 'product_tag') {
            if (isset($term['name']) && $term['name'] !== '') {
              $foundTermId = $this->_findPolylangTermByNameAndLang($term['name'], $taxonomy, $langCode, $termModel);
            }

            if ($foundTermId) {
              $termId = $foundTermId;
            } else {
              $termObj = get_term_by('name', $term['name'], $taxonomy);

              if ($termObj instanceof WP_Term) {
                $termId = (int)$termObj->term_id;
              }
            }
          } else {
            $termId = (int)$term['name'];
          }

          if ($termId) {
            $termLangCode = null;

            if (function_exists('pll_get_term_language')) {
              $termLangCode = pll_get_term_language($termId);
            } elseif ($termModel && method_exists($termModel, 'get_language')) {
              $langObj = $termModel->get_language($termId);

              if ($langObj && isset($langObj->slug)) {
                $termLangCode = $langObj->slug;
              }
            }

            if ($termLangCode === $langCode) {
              $term['name'] = (int)$termId;
              $mapped[] = $term;
              continue;
            }

            $trId = 0;

            if (function_exists('pll_get_term')) {
              $trId = (int)pll_get_term($termId, $langCode);
            } elseif ($termModel) {
              $trId = (int)$termModel->get($termId, $langCode);
            }

            if ($trId) {
              $term['name'] = (int)$trId;
            } else {
              if ($foundTermId === 0) {
                $termObj = get_term($termId, $taxonomy);

                if ($termObj && !is_wp_error($termObj)) {
                  $foundTermId = $this->_findPolylangTermByNameAndLang($termObj->name, $taxonomy, $langCode, $termModel);
                }
              }

              if ($foundTermId) {
                $term['name'] = (int)$foundTermId;
              } else {
                $createdTermId = $this->_createPolylangTermTranslation($termId, $langCode, $taxonomy, $termModel);

                if ($createdTermId) {
                  $term['name'] = (int)$createdTermId;
                }
              }
            }
          }

          $mapped[] = $term;
        }

        $result[$taxonomy] = $mapped;
      }
    }

    return $result;
  }

  /**
   * Find Polylang term by name and language
   *
   * @param string      $termName  Term name
   * @param string      $taxonomy  Taxonomy name
   * @param string|null $langCode  Lang code
   * @param object|null $termModel Term model
   *
   * @return int
   */
  protected function _findPolylangTermByNameAndLang($termName, $taxonomy, $langCode, $termModel = null)
  {
    if ($termName && $langCode) {
      $terms = get_terms([
        'taxonomy'   => $taxonomy,
        'name'       => $termName,
        'hide_empty' => false,
      ]);

      if (is_wp_error($terms)) {
        return 0;
      }

      if ($terms) {
        foreach ($terms as $term) {
          $termLangCode = null;

          if (function_exists('pll_get_term_language')) {
            $termLangCode = pll_get_term_language($term->term_id);
          } elseif ($termModel && method_exists($termModel, 'get_language')) {
            $langObj = $termModel->get_language($term->term_id);

            if ($langObj && isset($langObj->slug)) {
              $termLangCode = $langObj->slug;
            }
          }

          if ($termLangCode === $langCode) {
            return (int)$term->term_id;
          }
        }
      }
    }

    return 0;
  }

  /**
   * Translate taxonomy terms for a product based on active languages and product language code
   *
   * @param array       $termIds         Term IDs or names
   * @param string      $taxonomy        Taxonomy name
   * @param array       $languages       Language slugs
   * @param object|null $termModel       Term model
   * @param string|null $productLangCode Product language code
   *
   * @return void
   */
  protected function _polylangTranslateTaxonomy(array $termIds, $taxonomy, array $languages, $termModel = null, $productLangCode = null)
  {
    $terms = [];

    foreach ($termIds as $termId) {
      if ($taxonomy === 'product_tag') {
        $term = get_term_by('name', $termId, $taxonomy);
      } else {
        $term = get_term_by('id', (int)$termId, $taxonomy);
      }

      if ($term && !is_wp_error($term)) {
        $terms[] = $term;
      }
    }

    if ($terms) {
      foreach ($terms as $term) {
        $termLangCode = null;

        if (function_exists('pll_get_term_language')) {
          $termLangCode = pll_get_term_language($term->term_id);
        } elseif ($termModel && method_exists($termModel, 'get_language')) {
          $langObj = $termModel->get_language($term->term_id);

          if ($langObj && isset($langObj->slug)) {
            $termLangCode = $langObj->slug;
          }
        }

        if ($termLangCode === null || $termLangCode === '') {
          if ($productLangCode) {
            if (function_exists('pll_set_term_language')) {
              pll_set_term_language($term->term_id, $productLangCode);
            } elseif ($termModel && method_exists($termModel, 'set_language')) {
              $termModel->set_language($term->term_id, $productLangCode);
            }

            $termLangCode = $productLangCode;
          }
        }

        foreach ($languages as $langCode) {
          if ($termLangCode && $termLangCode === $langCode) {
            continue;
          }

          $translationId = 0;

          if (function_exists('pll_get_term')) {
            $translationId = (int)pll_get_term($term->term_id, $langCode);
          } elseif ($termModel) {
            $translationId = (int)$termModel->get($term->term_id, $langCode);
          }

          if ($translationId === 0) {
            $this->_createPolylangTermTranslation($term->term_id, $langCode, $taxonomy, $termModel);
          }
        }
      }
    }
  }

  /**
   * Get Polylang languages list
   *
   * @param object|null $model Polylang model
   *
   * @return array
   */
  protected function _getPolylangLanguagesList($model = null)
  {
    $languages = [];

    if (function_exists('pll_languages_list')) {
      $languages = pll_languages_list(['fields' => 'slug']);
    } elseif ($model && method_exists($model, 'get_languages_list')) {
      $languages = $model->get_languages_list(array('fields' => 'slug'));
    }

    if (is_array($languages)) {
      return $languages;
    }

    return [];
  }

  /**
   * Create Polylang term translation for a given term ID and language code
   *
   * @param int         $termId    Term ID
   * @param string|null $langCode  Language code
   * @param string      $taxonomy  Taxonomy name
   * @param object|null $termModel Polylang term model
   *
   * @return int
   */
  protected function _createPolylangTermTranslation($termId, $langCode, $taxonomy, $termModel)
  {
    if ($langCode) {
      $term = get_term($termId, $taxonomy);

      if ($term && !is_wp_error($term)) {
        $translations = $this->_getPolylangTermTranslations($termId, $termModel);

        if (isset($translations[$langCode])) {
          return (int)$translations[$langCode];
        }

        if ($translations === []) {
          $baseLangCode = null;

          if (function_exists('pll_get_term_language')) {
            $baseLangCode = pll_get_term_language($termId);
          } elseif ($termModel && method_exists($termModel, 'get_language')) {
            $langObj = $termModel->get_language($termId);

            if ($langObj && isset($langObj->slug)) {
              $baseLangCode = $langObj->slug;
            }
          }

          if ($baseLangCode) {
            $translations[$baseLangCode] = $termId;
          } else {
            if (function_exists('pll_set_term_language')) {
              pll_set_term_language($termId, $langCode);
            } elseif ($termModel) {
              $termModel->set_language($termId, $langCode);
            }

            return $termId;
          }
        }

        $args = [];

        if (is_taxonomy_hierarchical($taxonomy) && $term->parent) {
          $parentTranslationId = $this->_createPolylangTermTranslation($term->parent, $langCode, $taxonomy, $termModel);

          if ($parentTranslationId) {
            $args['parent'] = $parentTranslationId;
          }
        }

        if (!empty($term->description)) {
          $args['description'] = $term->description;
        }

        $termName = $term->name;
        $newTerm = null;
        $model = $this->_getPolylangModel();

        if ($termModel && $model && method_exists($termModel, 'insert')) {
          $langObj = $model->get_language($langCode);

          if ($langObj) {
            $newTerm = $termModel->insert($termName, $taxonomy, $langObj, $args);
          }
        }

        $newTermId = 0;

        if ($newTerm === null) {
          $newTerm = wp_insert_term($termName, $taxonomy, $args);
        }

        if ($newTerm instanceof WP_Error && $newTerm->get_error_data('term_exists')) {
          $uniqueArgs = $args;
          $uniqueName = $termName . ' (' . $langCode . ')';
          $uniqueSlug = '';

          if ($term->slug) {
            $uniqueSlug = $term->slug . '-' . $langCode;
          }

          if ($uniqueSlug) {
            $uniqueArgs['slug'] = sanitize_title($uniqueSlug);
          } else {
            $uniqueArgs['slug'] = sanitize_title($uniqueName);
          }

          $newTerm = null;

          if ($termModel && $model && method_exists($termModel, 'insert')) {
            $langObj = $model->get_language($langCode);

            if ($langObj) {
              $newTerm = $termModel->insert($uniqueName, $taxonomy, $langObj, $uniqueArgs);
            }
          }

          if ($newTerm === null) {
            $newTerm = wp_insert_term($uniqueName, $taxonomy, $uniqueArgs);
          }
        }

        if ($newTerm instanceof WP_Error) {
          $termExistsId = $newTerm->get_error_data('term_exists');

          if ($termExistsId) {
            $newTermId = (int)$termExistsId;
          }
        } elseif ($newTerm instanceof WP_Term) {
          $newTermId = (int)$newTerm->term_id;
        } elseif (is_array($newTerm) && isset($newTerm['term_id'])) {
          $newTermId = (int)$newTerm['term_id'];
        } elseif (is_int($newTerm) && $newTerm > 0) {
          $newTermId = $newTerm;
        }

        if ($newTermId > 0) {
          if (function_exists('pll_set_term_language')) {
            pll_set_term_language($newTermId, $langCode);
          } elseif ($termModel) {
            $termModel->set_language($newTermId, $langCode);
          }

          $translations[$langCode] = $newTermId;
          $this->_savePolylangTermTranslations($newTermId, $translations, $termModel);

          return $newTermId;
        }
      }
    }

    return 0;
  }

  /**
   * Get Polylang translations for a term
   *
   * @param int         $termId    Term ID
   * @param object|null $termModel Polylang term model
   *
   * @return array
   */
  protected function _getPolylangTermTranslations($termId, $termModel)
  {
    $translations = [];

    if (function_exists('pll_get_term_translations')) {
      $translations = pll_get_term_translations($termId);
    } elseif ($termModel) {
      $translations = $termModel->get_translations($termId);
    }

    if (is_array($translations)) {
      return $translations;
    }

    return [];
  }

  /**
   * Save Polylang translations for a term
   *
   * @param int         $termId       Term ID
   * @param array       $translations Translations array in format [lang_code => term_id]
   * @param object|null $termModel    Polylang term model
   *
   * @return void
   */
  protected function _savePolylangTermTranslations($termId, array $translations, $termModel)
  {
    if ($translations) {
      if (function_exists('pll_save_term_translations')) {
        pll_save_term_translations($translations);
      } elseif ($termModel) {
        $termModel->save_translations($termId, $translations);
      }
    }
  }

  /**
   * @param array $data Data
   *
   * @return WC_Data|WP_Error
   * @throws WC_Data_Exception
   */
  protected function _importProductBatch($data)
  {
    $id = isset($data['product_data']['id']) ? absint($data['product_data']['id']) : 0;

    if (isset($data['product_data']['type'])) {
      $className = 'WC_Product_' . implode('_', array_map('ucfirst', explode('-', $data['product_data']['type'])));

      if (!class_exists($className)) {
        $className = 'WC_Product_Simple';
      }

      $product = new $className($id);
    } elseif (isset($data['product_data']['id'])) {
      $product = wc_get_product($id);
    } else {
      $product = new WC_Product_Simple();
    }

    if (isset($data['product_data']['internal_data']['wpml_current_lang_id']) && $this->_wpmlEnabled) {
      do_action('wpml_switch_language', $data['product_data']['internal_data']['wpml_current_lang_id']);
    }

    if (isset($data['product_data']['data']['name'])) {
      $product->set_name(wp_filter_post_kses($data['product_data']['data']['name']));
    }

    if (isset($data['product_data']['data']['description'])) {
      $product->set_description(wp_filter_post_kses($data['product_data']['data']['description']));
    }

    if (isset($data['product_data']['data']['short_description'])) {
      $product->set_short_description(wp_filter_post_kses($data['product_data']['data']['short_description']));
    }

    if (isset($data['product_data']['data']['status'])) {
      $product->set_status(get_post_status_object($data['product_data']['data']['status']) ? $data['product_data']['data']['status'] : 'draft');
    }

    if (isset($data['product_data']['data']['slug'])) {
      $product->set_slug($data['product_data']['data']['slug']);
    }

    if (isset($data['product_data']['data']['virtual'])) {
      $product->set_virtual($data['product_data']['data']['virtual']);
    }

    if (isset($data['product_data']['data']['downloadable'])) {
      $product->set_downloadable($data['product_data']['data']['downloadable']);
    }

    if (isset($data['product_data']['data']['tax_class'])) {
      $product->set_tax_class($data['product_data']['data']['tax_class']);
    }

    if (isset($data['product_data']['data']['catalog_visibility'])) {
      $product->set_catalog_visibility($data['product_data']['data']['catalog_visibility']);
    }

    if (isset($data['product_data']['data']['virtual']) && true === $data['product_data']['data']['virtual']) {
      $product->set_weight('');
      $product->set_height('');
      $product->set_length('');
      $product->set_width('');
    } else {
      if (isset($data['product_data']['data']['weight'])) {
        $product->set_weight($data['product_data']['data']['weight']);
      }

      if (isset($data['product_data']['data']['height'])) {
        $product->set_height($data['product_data']['data']['height']);
      }

      if (isset($data['product_data']['data']['width'])) {
        $product->set_width($data['product_data']['data']['width']);
      }

      if (isset($data['product_data']['data']['length'])) {
        $product->set_length($data['product_data']['data']['length']);
      }
    }

    if (in_array($product->get_type(), ['variable', 'grouped'], true)) {
      $product->set_regular_price('');
      $product->set_sale_price('');
      $product->set_date_on_sale_to('');
      $product->set_date_on_sale_from('');
      $product->set_price('');
    } else {
      if (isset($data['product_data']['data']['regular_price'])) {
        $product->set_regular_price($data['product_data']['data']['regular_price']);
      }

      if (isset($data['product_data']['data']['sale_price'])) {
        $product->set_sale_price($data['product_data']['data']['sale_price']);
      }

      if (isset($data['product_data']['data']['date_on_sale_from'])) {
        $product->set_date_on_sale_from($data['product_data']['data']['date_on_sale_from']);
      }

      if (isset($data['product_data']['data']['date_on_sale_to'])) {
        $product->set_date_on_sale_to($data['product_data']['data']['date_on_sale_to']);
      }
    }

    if (isset($data['product_data']['data']['parent_id'])) {
      $product->set_parent_id($data['product_data']['data']['parent_id']);
    }

    if (isset($data['product_data']['data']['in_stock'])) {
      $stock_status = true === $data['product_data']['data']['in_stock'] ? 'instock' : 'outofstock';
    } else {
      $stock_status = $product->get_stock_status();
    }

    if ('yes' === get_option('woocommerce_manage_stock')) {
      if (isset($data['product_data']['data']['manage_stock'])) {
        $product->set_manage_stock($data['product_data']['data']['manage_stock']);
      }

      if (isset($data['product_data']['data']['backorders'])) {
        $product->set_backorders($data['product_data']['data']['backorders']);
      }

      if ($product->get_manage_stock()) {
        if (!$product->is_type('variable')) {
          $product->set_stock_status($stock_status);
        }

        if (isset($data['product_data']['data']['stock_quantity'])) {
          $product->set_stock_quantity(wc_stock_amount($data['product_data']['data']['stock_quantity']));
        }
      } else {
        $product->set_manage_stock('no');
        $product->set_stock_quantity('');
        $product->set_stock_status($stock_status);
      }
    } elseif (!$product->is_type('variable')) {
      $product->set_stock_status($stock_status);
    }

    if (isset($data['product_data']['data']['attributes'])) {
      $this->_setAttributes($product, $data);
    }

    $hasSkuUpdate = isset($data['product_data']['meta_data']) && array_key_exists('_sku', $data['product_data']['meta_data']);
    $changeSet = $product->get_changes();
    $metaChanges = [];

    $metaChangesKeys = array_diff(
      array_keys($changeSet),
      [
        'description',
        'short_description',
        'name',
        'parent_id',
        'reviews_allowed',
        'status',
        'menu_order',
        'date_created',
        'date_modified',
        'slug',
        'post_password',
      ]
    );

    foreach ($metaChangesKeys as $key) {
      if ($key === '_sku') {
        $metaChanges[$key] = wc_clean($changeSet[$key]);
      } else {
        $metaChanges[$key] = $changeSet[$key];
      }
    }

    if (isset($data['product_data']['meta_data'])) {
      $metaChanges += $data['product_data']['meta_data'];
    }

    if (isset($data['product_data']['meta_data']['_product_attributes'])) {
      $this->_readAttributes($product, maybe_unserialize($data['product_data']['meta_data']['_product_attributes']));
    }

    if (isset($data['product_data']['meta_data']) && array_key_exists('_upsell_ids', $data['product_data']['meta_data'])) {
      $upsells = array();
      $ids     = $data['product_data']['meta_data']['_upsell_ids'];

      if (!empty($ids)) {
        foreach ($ids as $upsellId) {
          if ($upsellId && $upsellId > 0) {
            $upsells[] = $upsellId;
          }
        }
      }

      $product->set_upsell_ids($upsells);
    }

    if (isset($data['product_data']['meta_data']) && array_key_exists('_crosssell_ids', $data['product_data']['meta_data'])) {
      $crosssells = array();
      $ids        = $data['product_data']['meta_data']['_crosssell_ids'];

      if (!empty($ids)) {
        foreach ($ids as $crossSellId) {
          if ($crossSellId && $crossSellId > 0) {
            $crosssells[] = $crossSellId;
          }
        }
      }

      $product->set_cross_sell_ids($crosssells);
    }

    if (isset($data['product_data']['meta_data'])) {
      foreach ($data['product_data']['meta_data'] as $metaKey => $metaData) {
        if (in_array($metaKey, ['_product_attributes', '_upsell_ids', '_crosssell_ids', '_sku'])) {
          continue;
        } else {
          if (is_null($metaData)) {
            $product->delete_meta_data($metaKey);
          } else {
            $product->update_meta_data($metaKey, $metaData);
          }
        }
      }
    }

    if (isset($data['product_data']['images'])) {
      $product = $this->_setProductImages($product, $data['product_data']['images']);
    }

    if ($hasSkuUpdate) {
      add_filter('wc_product_pre_has_unique_sku', '__return_true', 10, 3);
    }

    try {
      if (isset($data['product_data']['meta_data']) && array_key_exists('_sku', $data['product_data']['meta_data'])) {
        $product->set_sku($data['product_data']['meta_data']['_sku']);
        unset($metaChanges['_sku']);
        unset($data['product_data']['meta_data']['_sku']);
      }

      $product->save();
    } finally {
      if ($hasSkuUpdate) {
        remove_filter('wc_product_pre_has_unique_sku', '__return_true', 10);
      }
    }

    $productId = $product->get_id();

    if (isset($data['product_data']['terms_data'])) {
      $this->_setProductTerms($productId, $data['product_data']['terms_data']);
    }

    if ($this->_wpmlEnabled) {
      $this->_wpmlSync($product, $data, $metaChanges);
    } elseif ($this->_polylangEnabled) {
      $this->_polylangSync($product, $data, $id);
    }

    return $product;
  }

  /**
   * Set product images.
   *
   * @param WC_Product $product Product instance.
   * @param array      $images  Images data.
   *
   * @return WC_Product
   * @throws WC_Data_Exception
   */
  protected function _setProductImages(WC_Product $product, $images)
  {
    $productId = $product->get_id();

    if ($product->get_type() === 'variation') {
      $productType = 'post_product_variation';
    } else {
      $productType = 'post_product';
    }

    $images = is_array($images) ? array_filter($images) : [];

    if (!empty($images)) {
      $galleryPositions = [];

      foreach ($images as $pos => $image) {
        $attachment_id = isset($image['id']) ? absint($image['id']) : 0;

        if (0 === $attachment_id && isset($image['src'])) {
          $upload = wc_rest_upload_image_from_url(esc_url_raw($image['src']));

          if (is_wp_error($upload)) {
            if (!apply_filters('woocommerce_rest_suppress_image_upload_error', false, $upload, $productId, $images)) {
              throw new WC_Data_Exception('woocommerce_product_image_upload_error', $upload->get_error_message());
            } else {
              continue;
            }
          }

          $attachment_id = wc_rest_set_uploaded_image_as_attachment($upload, $productId);
        }

        if (!wp_attachment_is_image($attachment_id)) {
          /* translators: %s: attachment id */
          throw new WC_Data_Exception(
            'woocommerce_product_invalid_image_id',
            sprintf(__('#%s is an invalid image ID.', 'woocommerce'), $attachment_id)
          );
        }

        $galleryPositions[$attachment_id] = absint(isset($image['position']) ? $image['position'] : $pos);

        if (!empty($image['alt'])) {
          update_post_meta($attachment_id, '_wp_attachment_image_alt', wc_clean($image['alt']));
        }

        if (!empty($image['name'])) {
          wp_update_post(
            array(
              'ID'         => $attachment_id,
              'post_title' => $image['name'],
            )
          );
        }

        if (!empty($image['src'])) {
          update_post_meta($attachment_id, '_wc_attachment_source', esc_url_raw($image['src']));
        }
      }

      asort($galleryPositions);

      $gallery = array_keys($galleryPositions);

      // Featured image is in position 0.
      $imageId = array_shift($gallery);

      if ($this->_wpmlEnabled) {
        $currentLanguage = apply_filters('wpml_current_language', null);

        $objectId = apply_filters('wpml_object_id', $productId, $productType, true, $currentLanguage);

        if ($objectId !== null) {
          $trid         = apply_filters('wpml_element_trid', null, $objectId, 'post_product');
          $translations = apply_filters('wpml_get_element_translations', null, $trid, 'post_product', false, true);

          foreach ($translations as $translation) {
            $trProduct = WC()->product_factory->get_product($translation->{'element_id'});

            if ($trProduct) {
              $trProduct->set_image_id($imageId);
              $trProduct->set_gallery_image_ids($gallery);

              if (class_exists('Woo_Variation_Gallery') && $gallery && $trProduct->get_type() === 'post_product_variation') {
                $trProduct->add_meta_data('woo_variation_gallery_images', $gallery, true);
              }
            }
          }
        }
      } else {
        $product->set_image_id($imageId);
        $product->set_gallery_image_ids($gallery);

        if (class_exists('Woo_Variation_Gallery') && $gallery && $productType === 'post_product_variation') {
          $product->add_meta_data('woo_variation_gallery_images', $gallery, true);
        }
      }

      $product->set_image_id($imageId);
      $product->set_gallery_image_ids($gallery);

      if (class_exists('Woo_Variation_Gallery') && $gallery && $productType === 'post_product_variation') {
        $product->add_meta_data('woo_variation_gallery_images', $gallery, true);
      }
    } else {
      if ($this->_wpmlEnabled) {
        $currentLanguage = apply_filters('wpml_current_language', null);

        $objectId = apply_filters('wpml_object_id', $productId, $productType, true, $currentLanguage);

        if ($objectId !== null) {
          $trid         = apply_filters('wpml_element_trid', null, $objectId, 'post_product');
          $translations = apply_filters('wpml_get_element_translations', null, $trid, 'post_product', false, true);

          foreach ($translations as $translation) {
            $trProduct = WC()->product_factory->get_product($translation->{'element_id'});

            if ($trProduct) {
              $trProduct->set_image_id('');
              $trProduct->set_gallery_image_ids([]);

              if (class_exists('Woo_Variation_Gallery') && $trProduct->get_type() === 'post_product_variation') {
                $product->delete_meta_data('woo_variation_gallery_images');
              }
            }
          }
        }
      } else {
        $product->set_image_id('');
        $product->set_gallery_image_ids([]);

        if ( class_exists( 'Woo_Variation_Gallery' ) && $product->get_type() === 'post_product_variation' ) {
          $product->delete_meta_data( 'woo_variation_gallery_images' );
        }
      }
    }

    return $product;
  }

  /**
   * @param WC_Product $product     Product
   * @param array      $a2cData     Data
   * @param array      $metaChanges Meta Data changes
   *
   * @throws Exception
   */
  protected function _wpmlSync(WC_Product $product, $a2cData, $metaChanges)
  {
    $productId = $product->get_id();

    //WPML support
    if (defined('ICL_SITEPRESS_VERSION') && defined('ICL_PLUGIN_INACTIVE') && !ICL_PLUGIN_INACTIVE && class_exists('SitePress')) {
      global $sitepress, $wpdb;

      $sitepress = WPML\Container\make('\SitePress');

      $productType         = $product->get_type();
      $elementType         = $productType === 'variation' ? 'post_product_variation' : 'post_product';
      $activeLanguages     = $sitepress->get_active_languages(true);
      $productLangCode     = apply_filters('wpml_element_language_code', null, ['element_id' => $productId, 'element_type' => $elementType]);
      $trIdProduct         = apply_filters('wpml_element_trid', null, $productId, $elementType);
      $productTranslations = apply_filters('wpml_get_element_translations', null, $trIdProduct, $elementType, false, true);

      if (isset($a2cData['product_data']['terms_data']['product_cat'])) {
        $this->_translateTaxonomy(
          array_unique(array_column($a2cData['product_data']['terms_data']['product_cat'], 'name')),
          'product_cat',
          $activeLanguages
        );
      }

      if (isset($a2cData['product_data']['terms_data']['product_tag'])) {
        $this->_translateTaxonomy(
          array_unique(array_column($a2cData['product_data']['terms_data']['product_tag'], 'name')),
          'product_tag',
          $activeLanguages
        );
      }

      if (isset($a2cData['product_data']['internal_data']['wpml_only_translate_to'])) {
        if (is_array($a2cData['product_data']['internal_data']['wpml_only_translate_to'])) {
          foreach ($a2cData['product_data']['internal_data']['wpml_only_translate_to'] as $languageCode) {
            do_action('wpml_switch_language', $languageCode);
            $sitepress->make_duplicate($productId, $languageCode);
          }
        } else {
          do_action('wpml_switch_language', $a2cData['product_data']['internal_data']['wpml_only_translate_to']);
          $sitepress->make_duplicate($productId, $a2cData['product_data']['internal_data']['wpml_only_translate_to']);
        }

        $productTranslations = apply_filters('wpml_get_element_translations', null, $trIdProduct, $elementType, false, true);
      }

      unset($metaChanges['image_id']);
      unset($metaChanges['category_ids']);
      unset($metaChanges['tag_ids']);
      unset($metaChanges['gallery_image_ids']);
      $attributes = $product->get_attributes('db');
      $sku = $product->get_sku();

      foreach ($productTranslations as $translation) {
        if (!is_null($translation->source_language_code)) {
          do_action('wpml_switch_language', $translation->language_code);
          $className = 'WC_Product_' . implode('_', array_map('ucfirst', explode('-', $productType)));

          if (class_exists($className)) {
            $trProduct = new $className($translation->element_id);
          } else {
            $trProduct = WC()->product_factory->get_product($translation->element_id);
          }

          if ($trProduct instanceof WC_Product) {
            if ($attributes) {
              $trProduct->set_attributes($attributes);
            }

            if ($sku !== null && $sku !== '') {
              add_filter('wc_product_pre_has_unique_sku', '__return_true', 10, 3);

              try {
                $trProduct->set_sku($sku);
              } finally {
                remove_filter('wc_product_pre_has_unique_sku', '__return_true', 10);
              }
            }

            foreach ($metaChanges as $productProperty => $productData) {
              if (method_exists($trProduct, 'set_' . $productProperty) && $productData !== null) {
                call_user_func_array(array($trProduct, 'set_' . $productProperty), [$productData]);
              } elseif ($productProperty !== '_product_attributes') {
                update_post_meta($trProduct->get_id(), $productProperty, $productData);
              }
            }

            if ($product->get_type() === 'variation') {
              $this->_wpmlSyncVariation($product, $trProduct, $translation->language_code);
            }

            if (isset($a2cData['product_data']['internal_data']['wpml_translations_meta'][$translation->language_code])) {
              foreach ($a2cData['product_data']['internal_data']['wpml_translations_meta'][$translation->language_code] as $metaKey => $metaValue) {
                if (is_null($metaValue)) {
                  delete_post_meta($trProduct->get_id(), $metaKey);
                } else {
                  update_post_meta($trProduct->get_id(), $metaKey, $metaValue);
                }
              }
            }

            if ($trProduct->get_changes()) {
              $trProduct->save();
            }
          }
        }
      }

      foreach ($productTranslations as $translation) {
        do_action('wpml_switch_language', $translation->language_code);

        if (isset($a2cData['product_data']['terms_data']['product_cat'])) {
          //instead wp_delete_object_term_relationships
          $wpdb->query(
            $wpdb->prepare("
              DELETE tr
              FROM {$wpdb->term_relationships}  tr
                JOIN {$wpdb->term_taxonomy} tt
                  ON tt.term_taxonomy_id = tr.term_taxonomy_id
              WHERE tr.object_id IN (%d) AND tt.taxonomy = %s",
              $translation->element_id,
              'product_cat'
            )
          );
          wp_set_object_terms(
            $translation->element_id,
            array_unique(array_column($a2cData['product_data']['terms_data']['product_cat'], 'name')),
            'product_cat'
          );
        }

        if (isset($a2cData['product_data']['terms_data'])) {
          foreach ($a2cData['product_data']['terms_data'] as $taxonomy => $items) {
            $forAllLang = false;
            $append     = false;

            if (isset($items[0]['all_lang'])) {
              $forAllLang = (bool)$items[0]['all_lang'];
            }

            if (isset($items[0]['append'])) {
              $append = (bool)$items[0]['append'];
            }

            if ($taxonomy === 'product_cat' || !$forAllLang) {
              continue;
            }

            $oldObjectTerms = wp_get_object_terms(
              $translation->element_id,
              $taxonomy,
              array(
                'fields'                 => 'ids',
                'orderby'                => 'none',
                'update_term_meta_cache' => false,
              )
            );

            //instead wp_delete_object_term_relationships
            $wpdb->query(
              $wpdb->prepare("
                DELETE tr
                FROM {$wpdb->term_relationships}  tr
                  JOIN {$wpdb->term_taxonomy} tt
                    ON tt.term_taxonomy_id = tr.term_taxonomy_id
                WHERE tr.object_id IN (%d) AND tt.taxonomy = %s",
                $translation->element_id,
                $taxonomy
              )
            );

            foreach ($items as $item) {
              $termId = term_exists($item['name'], $taxonomy);

              if ($termId) {
                wp_set_object_terms($translation->element_id, (int)$termId['term_id'], $taxonomy, true);
              }
            }

            if ($append) {
              wp_set_object_terms($translation->element_id, $oldObjectTerms, $taxonomy, true);
            }
          }
        }
      }

      $this->_rollbackProtectedData($productId, $a2cData, $productLangCode);
    }
  }

  /**
   * @param WC_Product $product   Product
   * @param WC_Product $trProduct Product translation
   * @param string     $langCode  Language Code
   *
   * @throws Exception
   */
  protected function _wpmlSyncVariation(WC_Product $product, WC_Product $trProduct, $langCode)
  {
    if ($attributes = $product->get_attributes()) {
      $translatedAttributes = [];

      foreach ($attributes as $attributeName => $attributeValue) {
        if (taxonomy_exists($attributeName)) {
          $term = get_term_by('slug', $attributeValue, $attributeName);

          if ($term && !is_wp_error($term)) {
            $translatedTermId = apply_filters('translate_object_id', $term->term_id, $attributeName, false, $langCode);

            do_action('wpml_switch_language', $langCode);
            $translatedTerm = get_term_by('id', $translatedTermId, $attributeName);

            if ($translatedTerm && !is_wp_error($translatedTerm)) {
              $trAttributeValue = $translatedTerm->slug;
            } else {
              $trAttributeValue = $attributeValue;
            }
          } else {
            $trAttributeValue = $attributeValue;
          }
        } else {
          $trAttributeValue = apply_filters('wpml_translate_single_string', $attributeValue, 'woocommerce', $attributeName, $langCode);
        }

        $translatedAttributes[$attributeName] = $trAttributeValue;
      }

      $trProduct->set_attributes($translatedAttributes);
    }

    if ($imageId = $product->get_image_id()) {
      $trProduct->set_image_id($imageId);
    }
  }

  /**
   * @param WC_Product $product Product
   * @param array      $data    Meta attributes
   */
  protected function _setAttributes(WC_Product $product, $data)
  {
    global $wpdb;

    if ($product->is_type('variation')) {
      $attributes       = [];
      $parent           = wc_get_product($data['product_data']['data']['parent_id']);
      $parentAttributes = $parent->get_attributes();

      foreach ($data['product_data']['data']['attributes'] as $attribute) {
        $attributeId      = 0;
        $rawAttributeName = '';

        if (!empty($attribute['id'])) {
          $attributeId      = absint($attribute['id']);
          $rawAttributeName = wc_attribute_taxonomy_name_by_id($attributeId);
        } elseif (!empty($attribute['name'])) {
          $rawAttributeName = sanitize_title($attribute['name']);
        }

        if (!$attributeId && !$rawAttributeName) {
          continue;
        }

        $attributeName = sanitize_title($rawAttributeName);

        if (!isset($parentAttributes[$attributeName]) || !$parentAttributes[$attributeName]->get_variation()) {
          continue;
        }

        $attributeKey   = sanitize_title($parentAttributes[$attributeName]->get_name());
        $attributeValue = isset($attribute['option']) ? wc_clean(stripslashes($attribute['option'])) : '';

        if ($parentAttributes[$attributeName]->is_taxonomy()) {
          $term = get_term_by('name', $attributeValue, $rawAttributeName);

          if ($term && !is_wp_error($term)) {
            $attributeValue = $term->slug;
          } else {
            $attributeValue = sanitize_title($attributeValue);
          }
        }

        $attributes[$attributeKey] = $attributeValue;
      }

      $product->set_attributes($attributes);
    } else {
      $attributes = [];

      foreach ($data['product_data']['data']['attributes'] as $attribute) {
        $attributeId   = 0;
        $attributeName = '';

        if (!empty($attribute['id'])) {
          $attributeId   = absint($attribute['id']);
          $attributeName = wc_attribute_taxonomy_name_by_id($attributeId);
        } elseif (!empty($attribute['name'])) {
          $attributeName = wc_clean($attribute['name']);
        }

        if (!$attributeId && !$attributeName) {
          continue;
        }

        if ($attributeId) {

          if (isset($attribute['options'])) {
            $options = $attribute['options'];

            if (!is_array($attribute['options'])) {
              $options = explode(WC_DELIMITER, $options);
            }

            $values = array_map('wc_sanitize_term_text_based', $options);
            $values = array_filter($values, 'strlen');
          } else {
            $values = array();
          }

          if (!empty($values)) {
            $attributeObject = new WC_Product_Attribute();
            $attributeObject->set_id($attributeId);
            $attributeObject->set_name($attributeName);
            $attributeObject->set_options($values);
            $attributeObject->set_position(isset($attribute['position']) ? (string)absint($attribute['position']) : '0');
            $attributeObject->set_visible((isset($attribute['visible']) && $attribute['visible']) ? 1 : 0);
            $attributeObject->set_variation((isset($attribute['variation']) && $attribute['variation']) ? 1 : 0);
            $attributes[] = $attributeObject;
          }
        } elseif (isset($attribute['options'])) {
          if (is_array($attribute['options'])) {
            $values = $attribute['options'];
          } else {
            $values = explode(WC_DELIMITER, $attribute['options']);
          }

          $existingValues = array();
          $existingAttrs = $product->get_attributes();

          if ($existingAttrs) {
            foreach ($existingAttrs as $existingAttr) {
              if ($existingAttr instanceof WC_Product_Attribute && !$existingAttr->is_taxonomy()) {
                if ($existingAttr->get_name() === $attributeName) {
                  $existingValues = (array)$existingAttr->get_options();
                  break;
                }
              }
            }
          }

          if ($existingValues) {
            $values = array_merge($existingValues, $values);
            $values = array_values(array_unique(array_map('trim', $values)));
          } else {
            $values = array_values(array_unique(array_map('trim', $values)));
          }

          $attributeObject = new WC_Product_Attribute();
          $attributeObject->set_name($attributeName);
          $attributeObject->set_options($values);
          $attributeObject->set_position(isset($attribute['position']) ? (string)absint($attribute['position']) : '0');
          $attributeObject->set_visible((isset($attribute['visible']) && $attribute['visible']) ? 1 : 0);
          $attributeObject->set_variation((isset($attribute['variation']) && $attribute['variation']) ? 1 : 0);
          $attributes[] = $attributeObject;
        }
      }

      $product->set_attributes($attributes);

      if ($this->_wpmlEnabled) {
        $sitepress = WPML\Container\make('\SitePress');

        $activeLanguages = $sitepress->get_active_languages(true);

        /** @var WC_Product_Attribute $attribute */
        foreach ($attributes as $attribute) {
          if ($attribute->is_taxonomy()) {
            $terms  = $attribute->get_terms();
            $values = [];

            /** @var WP_Term $term */
            foreach ($terms as $term) {
              $values[] = $term->term_id;
            }

            if ($values) {
              $this->_translateTaxonomy(array_unique($values), $attribute->get_taxonomy(), $activeLanguages);
            }
          }
        }

        $trIdProduct         = apply_filters('wpml_element_trid', null, $product->get_id(), 'post_product');
        $productTranslations = apply_filters('wpml_get_element_translations', null, $trIdProduct, 'post_product', false, true);

        foreach ($productTranslations as $translation) {
          do_action('wpml_switch_language', $translation->language_code);
          $trProduct = WC()->product_factory->get_product($translation->element_id);

          if ($trProduct instanceof WC_Product) {

            /** @var WC_Product_Attribute $attribute */
            foreach ($attributes as $attribute) {
              if ($attribute->is_taxonomy()) {
                $terms  = $attribute->get_terms();
                $values = [];

                /** @var WP_Term $term */
                foreach ($terms as $term) {
                  $values[] = $term->term_id;
                }

                //instead wp_delete_object_term_relationships
                $wpdb->query(
                  $wpdb->prepare("
                    DELETE tr
                    FROM {$wpdb->term_relationships}  tr
                      JOIN {$wpdb->term_taxonomy} tt
                        ON tt.term_taxonomy_id = tr.term_taxonomy_id
                    WHERE tr.object_id IN (%d) AND tt.taxonomy = %s",
                    $translation->element_id,
                    $attribute->get_taxonomy()
                  )
                );
                wp_set_object_terms(
                  $translation->element_id,
                  $values,
                  $attribute->get_taxonomy()
                );
              }
            }

          }
        }
      }
    }
  }

  /**
   * @param WC_Product $product        Product
   * @param array      $metaAttributes Meta attributes
   */
  protected function _readAttributes(WC_Product $product, $metaAttributes)
  {
    if (!empty($metaAttributes) && is_array($metaAttributes)) {
      $attributes = array();
      foreach ($metaAttributes as $meta_attribute_key => $meta_attribute_value) {
        $meta_value = array_merge(
          array(
            'name'         => '',
            'value'        => '',
            'position'     => 0,
            'is_visible'   => 0,
            'is_variation' => 0,
            'is_taxonomy'  => 0,
          ),
          (array)$meta_attribute_value
        );

        // Check if is a taxonomy attribute.
        if (!empty($meta_value['is_taxonomy'])) {
          if (!taxonomy_exists($meta_value['name'])) {
            continue;
          }

          $id      = wc_attribute_taxonomy_id_by_name($meta_value['name']);
          $options = wc_get_object_terms($product->get_id(), $meta_value['name'], 'term_id');
        } else {
          $id      = 0;
          $options = wc_get_text_attributes($meta_value['value']);
        }

        $attribute = new WC_Product_Attribute();
        $attribute->set_id($id);
        $attribute->set_name($meta_value['name']);
        $attribute->set_options(array_unique($options));
        $attribute->set_position($meta_value['position']);
        $attribute->set_visible($meta_value['is_visible']);
        $attribute->set_variation($meta_value['is_variation']);
        $attributes[] = $attribute;
      }

      $product->set_attributes($attributes);
    }
  }

  /**
   * @param int         $productId       Product ID
   * @param array       $a2cData         Data
   * @param string|null $productLangCode Lang code
   */
  protected function _rollbackProtectedData($productId, $a2cData, $productLangCode)
  {
    global $wpdb;

    if (isset($a2cData['product_data']['internal_data']['wpml_current_lang_id'])) {
      $productLangCode = $a2cData['product_data']['internal_data']['wpml_current_lang_id'];
    }

    if (isset($a2cData['product_data']['protected_data'])) {
      $trIdProduct         = apply_filters('wpml_element_trid', null, $productId, 'post_product');
      $productTranslations = apply_filters('wpml_get_element_translations', null, $trIdProduct, 'post_product', false, true);

      foreach ( $productTranslations as $translation ) {
        if ($productLangCode !== $translation->language_code && isset($a2cData['product_data']['protected_data'][ $translation->language_code ])) {
          $fieldAssignments = [];
          $values = [];

          foreach ($a2cData['product_data']['protected_data'][ $translation->language_code ] as $field => $value) {
            $fieldAssignments[] = "$field = %s";
            $values[] = $value;
          }

          $fields = implode(', ', $fieldAssignments);

          $values[] = $translation->element_id;

          $wpdb->query(
            $wpdb->prepare("
              UPDATE {$wpdb->posts}
              SET {$fields}
              WHERE ID = %d",
              $values
            )
          );
        }
      }
    }

    if (isset($a2cData['product_data']['internal_data']['polylang_created_ids'])) {
      $createdIds = $a2cData['product_data']['internal_data']['polylang_created_ids'];

      if (is_array($createdIds)) {
        foreach ($createdIds as $createdId) {
          $product = WC()->product_factory->get_product((int)$createdId);

          if ($product instanceof WC_Product) {
            $product->delete(true);
          }
        }
      }
    }
  }

  /**
   * @param int         $productId Product ID
   * @param array       $a2cData   Data
   * @param object|null $postModel Post model
   *
   * @return void
   */
  protected function _rollbackPolylangBaseProtectedData($productId, $a2cData, $postModel)
  {
    global $wpdb;

    if (isset($a2cData['product_data']['protected_data']) && is_array($a2cData['product_data']['protected_data'])) {
      $protectedData = $a2cData['product_data']['protected_data'];
      $langCode = $this->_polylangGetTermLanguage(null, false, $productId, $postModel);
      $allowedFields = [
        'post_title'   => true,
        'post_content' => true,
        'post_excerpt' => true,
        'post_name'    => true,
        'post_status'  => true,
      ];

      $fieldsData = [];

      if ($langCode && isset($protectedData[$langCode]) && is_array($protectedData[$langCode])) {
        $fieldsData = $protectedData[$langCode];
      } elseif (array_intersect_key($protectedData, $allowedFields)) {
        $fieldsData = $protectedData;
      }

      if ($fieldsData) {
        $fieldsData = array_intersect_key($fieldsData, $allowedFields);
        $fieldAssignments = [];
        $values = [];

        foreach ($fieldsData as $field => $value) {
          $fieldAssignments[] = "$field = %s";
          $values[] = $value;
        }

        if ($fieldAssignments) {
          $fields = implode(', ', $fieldAssignments);
          $values[] = (int)$productId;

          $wpdb->query(
            $wpdb->prepare("
              UPDATE {$wpdb->posts}
              SET {$fields}
              WHERE ID = %d",
              $values
            )
          );
        }
      }
    }
  }

  /**
   * @param array  $termIds         Term IDs
   * @param string $taxonomy        Taxonomy name
   * @param array  $activeLanguages Active Languages
   * @param bool   $useSlug         Use Slug flag
   */
  protected function _translateTaxonomy($termIds, $taxonomy, $activeLanguages, $useSlug = false)
  {
    $termType = $taxonomy;
    $terms    = [];

    foreach ($termIds as $termId) {
      if ($taxonomy === 'product_tag') {
        $term = get_term_by('name', $termId, $taxonomy);
      } else {
        $term = get_term_by('id', (int)$termId, $taxonomy);
      }

      if ($term) {
        $terms[] = $term;
      }
    }

    foreach ($terms as $term) {
      foreach ($activeLanguages as $language) {
        do_action('wpml_switch_language', $language['code']);
        $tr_id = apply_filters('translate_object_id', $term->term_id, $termType, false, $language['code']);

        if (is_null($tr_id)) {
          $term_args = [];

          // hierarchy - parents.
          if (is_taxonomy_hierarchical($termType)) {
            // fix hierarchy.
            if ($term->parent) {
              $original_parent_translated = apply_filters('translate_object_id', $term->parent, $termType, false, $language['code']);
              if ($original_parent_translated) {
                $term_args['parent'] = $original_parent_translated;
              }
            }
          }

          $term_name         = $term->name;
          $slug              = ($useSlug ? $term->slug : $term->name) . '-' . $language['code'];
          $slug              = WPML_Terms_Translations::term_unique_slug($slug, $termType, $language['code']);
          $term_args['slug'] = $slug;

          if (!empty($term->description)) {
            $term_args['description'] = $term->description;
          }

          $new_term = wp_insert_term($term_name, $termType, $term_args);

          if ($new_term && !is_wp_error($new_term)) {
            $tt_id = apply_filters('wpml_element_trid', null, $term->term_taxonomy_id, 'tax_' . $termType);

            $set_language_args = array(
              'element_id'    => $new_term['term_taxonomy_id'],
              'element_type'  => 'tax_' . $termType,
              'trid'          => $tt_id,
              'language_code' => $language['code'],
            );

            do_action('wpml_set_element_language_details', $set_language_args);
          }
        }
      }
    }
  }

  /**
   * @param int $productId Product ID
   */
  protected function _cleanGarbage($productId)
  {
    try {
      if (defined('ICL_SITEPRESS_VERSION') && defined('ICL_PLUGIN_INACTIVE') && !ICL_PLUGIN_INACTIVE && class_exists('SitePress')) {
        $trIdProduct         = apply_filters('wpml_element_trid', null, $productId, 'post_product');
        $productTranslations = apply_filters('wpml_get_element_translations', null, $trIdProduct, 'post_product', false, true);

        foreach ($productTranslations as $translation) {
          do_action('wpml_switch_language', $translation->language_code);
          $product = WC()->product_factory->get_product($translation->element_id);

          if ($product instanceof WC_Product) {
            $product->delete(true);
          }
        }
      } else {
        $product = WC()->product_factory->get_product($productId);

        if ($product instanceof WC_Product) {
          $product->delete(true);
        }
      }
    } catch (Throwable $e) {
    }
  }

  /**
   * Adds a note (comment) to the order. Order must exist.
   *
   * @param string $orderId        Order ID
   * @param string $note           Note to add.
   * @param int    $isCustomerNote Is this a note for the customer?.
   * @param bool   $addedByAdmin   Was the note added by a admin?
   *
   * @return int                       Comment ID.
   */
  protected function _addOrderNote( $orderId, $note, $isCustomerNote = 0, $addedByAdmin = false ) {
    if ($addedByAdmin) {
      $comment_admin_email = get_option('admin_email');
      $user                = get_user_by('email', $comment_admin_email);

      if ( $user ) {
        $comment_author = $user->display_name;
      } else {
        $comment_author = $comment_admin_email;
      }
    } else {
      $comment_author = esc_html__('WooCommerce', 'woocommerce');
      $comment_author_email = esc_html__('WooCommerce', 'woocommerce') . '@';
      $comment_author_email .= isset($_SERVER['HTTP_HOST']) ? str_replace('www.', '', sanitize_text_field(wp_unslash($_SERVER['HTTP_HOST']))) : 'noreply.com';
      $comment_author_email = sanitize_email($comment_author_email);
    }

    $commentdata = apply_filters(
      'woocommerce_new_order_note_data',
      array(
        'comment_post_ID'      => $orderId,
        'comment_author'       => $comment_author,
        'comment_author_email' => $comment_author_email,
        'comment_author_url'   => '',
        'comment_content'      => $note,
        'comment_agent'        => 'WooCommerce',
        'comment_type'         => 'order_note',
        'comment_parent'       => 0,
        'comment_approved'     => 1,
      ),
      array(
        'order_id'         => $orderId,
        'is_customer_note' => $isCustomerNote,
      )
    );

    $commentId = wp_insert_comment($commentdata);

    if ($isCustomerNote) {
      add_comment_meta($commentId, 'is_customer_note', 1);

      do_action(
        'woocommerce_new_customer_note',
        array(
          'order_id'      => $orderId,
          'customer_note' => $commentdata['comment_content'],
        )
      );
    }

    return $commentId;
  }

  /**
   * @param array $a2cData Data
   *
   * @return array|mixed
   */
  public function orderCalculate($a2cData)
  {
    $response = [
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => [],
    ];

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      chdir(M1_STORE_BASE_DIR . '/wp-admin');
      $this->_safeLoad();

      if (function_exists('switch_to_blog')) {
        switch_to_blog($a2cData['store_id']);
      }

      $user = get_user_by('email', $a2cData['email']);
      $wc = WC();

      if ($user) {
        $wc->customer = new WC_Customer($user->ID);
      } else {
        $wc->customer = new WC_Customer();
      }

      if (!$wc->cart) {
        if (method_exists($wc, 'initialize_cart')) {
          $wc->initialize_cart();
        } else {
          $wc->cart = new WC_Cart();
        }

        $wc->frontend_includes();
      }

      if (!$wc->session) {
        if (method_exists($wc, 'initialize_session')) {
          $wc->initialize_session();
        } else {
          $wc->session = new WC_Session_Handler();
        }
      }

      $wc->cart->empty_cart();

      foreach ($a2cData['items'] as $item) {
        $wc->cart->add_to_cart((int)$item['id'], $item['quantity'], (int)($item['variant_id']), $item['variation'], $item['matafields']);
      }

      foreach (['shipping', 'billing'] as $addressType) {
        foreach ($a2cData[$addressType] as $field => $value) {
          $method = "set_{$addressType}_{$field}";

          if (method_exists($wc->customer, $method)) {
            call_user_func_array([$wc->customer, $method], [$value]);
          }
        }
      }

      if (!empty($a2cData['coupons'])) {
        foreach ($a2cData['coupons'] as $coupon) {
          if (method_exists($wc->cart, 'apply_coupon')) {
            $wc->cart->apply_coupon($coupon);
          } elseif (method_exists($wc->cart, 'add_discount')) {
            $wc->cart->add_discount($coupon);
          }
        }
      }

      $wc->cart->calculate_totals();
      $wc->cart->calculate_shipping();
      $packages = $wc->shipping->get_packages();
      $availableMethods = [];
      $products = [];

      foreach ($packages as $package) {
        if (!empty($package['rates'])) {
          foreach ($package['rates'] as $rateId => $rate) {
            $availableMethods[$rateId] = [
              'id'    => $rateId,
              'label' => $rate->label,
              'cost'  => $rate->cost,
              'taxes' => [],
            ];

            if (!empty($rate->taxes)) {
              foreach ($rate->taxes as $taxRateId => $amount) {
                if (method_exists(WC_Tax::class, 'get_rate_percent_value')) {
                  $taxRatePercent = WC_Tax::get_rate_percent_value($taxRateId);
                } elseif (method_exists(WC_Tax::class, 'get_rate_percent')) {
                  $taxRatePercent = (float)WC_Tax::get_rate_percent($taxRateId);
                }

                $availableMethods[$rateId]['taxes'][] = [
                  'amount'       => $amount,
                  'rate_percent' => $taxRatePercent,
                ];
              }
            }
          }
        }
      }

      foreach ($wc->cart->get_cart() as $key => $product) {
        $products[$key] = [
          'product_id'        => $product['product_id'],
          'quantity'          => $product['quantity'],
          'variation_id'      => $product['variation_id'],
          'line_subtotal'     => $product['line_subtotal'],
          'line_subtotal_tax' => $product['line_subtotal_tax'],
          'line_total'        => $product['line_total'],
          'name'              => $product['data']->get_name(),
          'sku'               => $product['data']->get_sku(),
          'weight'            => $product['data']->get_weight(),
          'attributes'        => [],
          'discount'          => (float)$product['line_subtotal'] - (float)$product['line_total'],
          'tax_discount'      => (float)$product['line_subtotal_tax'] - (float)$product['line_tax'],
        ];

        if (method_exists($product['data'], 'get_attribute_summary')) {
          $products[$key]['attribute_summary'] = $product['data']->get_attribute_summary();
        } else {
          $products[$key]['attribute_summary'] = [];
        }

        $attributes = $product['data']->get_attributes();

        if (!empty($attributes)) {
          foreach ($attributes as $attributeName => $attributeValue) {
            $products[$key]['attributes'][] = [
              'name'  => $attributeName,
              'value' => $attributeValue,
              'title' => wc_attribute_label($attributeName, $product['data']),
            ];
          }
        }
      }

      $appliedCoupons = $wc->cart->get_applied_coupons();
      $couponDiscounts = [];

      if (!empty($appliedCoupons)) {
        foreach ($appliedCoupons as $code) {
          $couponData = new WC_Coupon($code);

          $couponDiscounts[] = [
            'code'            => $code,
            'discount_amount' => $wc->cart->get_coupon_discount_amount($code),
            'discount_tax'    => $wc->cart->get_coupon_discount_tax_amount($code),
            'free_shipping'   => $couponData->get_free_shipping()
          ];
        }
      }

      $taxes = [];

      if (!empty($wc->cart->taxes)) {
        foreach ($wc->cart->taxes as $taxRateId => $amount) {
          if (method_exists(WC_Tax::class, 'get_rate_percent_value')) {
            $taxRatePercent = WC_Tax::get_rate_percent_value($taxRateId);
          } elseif (method_exists(WC_Tax::class, 'get_rate_percent')) {
            $taxRatePercent = (float)WC_Tax::get_rate_percent($taxRateId);
          }

          $taxes[] = [
            'tax_rate_id' => $taxRateId,
            'percent'     => $taxRatePercent,
            'label'       => WC_Tax::get_rate_label($taxRateId),
            'amount'      => $amount,
          ];
        }
      }

      $response['result'] = [
        'customer'           => [
          'id'         => $wc->customer->get_id(),
          'email'      => $wc->customer->get_email(),
          'first_name' => $wc->customer->get_first_name(),
          'last_name'  => $wc->customer->get_last_name(),
        ],
        'taxes'              => $taxes,
        'weight_unit'        => get_option('woocommerce_weight_unit'),
        'coupon_discounts'   => $couponDiscounts,
        'shipping_methods'   => $availableMethods,
        'products'           => $products,
        'prices_include_tax' => wc_prices_include_tax(),
        'currency'           => get_woocommerce_currency(),
      ];

      if (method_exists($wc->customer, 'get_shipping_phone')) {
        $response['result']['customer']['phone'] = $wc->customer->get_shipping_phone();
      }

      if (empty($wc->cart->subtotal_ex_tax)) {
        $response['result']['subtotal'] = $wc->cart->subtotal;
      } else {
        $response['result']['subtotal'] = $wc->cart->subtotal_ex_tax;
      }

      $wc->cart->empty_cart();
    } catch (Exception $e) {
      return $reportError($e);
    }

    return $response;
  }

}


/**
 * Class M1_Config_Adapter_Virtuemart113
 */
class M1_Config_Adapter_Virtuemart113 extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_Virtuemart113 constructor.
   */
  public function __construct()
  {
    require_once M1_STORE_BASE_DIR . "/configuration.php";

    if (class_exists("JConfig")) {

      $jconfig = new JConfig();

      $this->setHostPort($jconfig->host);
      $this->dbname   = $jconfig->db;
      $this->username = $jconfig->user;
      $this->password = $jconfig->password;
      $this->timeZone = $jconfig->offset;
      $this->tblPrefix = $jconfig->dbprefix;
    } else {

      $this->setHostPort($mosConfig_host);
      $this->dbname   = $mosConfig_db;
      $this->username = $mosConfig_user;
      $this->password = $mosConfig_password;
    }

    if (file_exists(M1_STORE_BASE_DIR . "/administrator/components/com_virtuemart/version.php")) {
      $ver = file_get_contents(M1_STORE_BASE_DIR . "/administrator/components/com_virtuemart/version.php");
      if (preg_match('/\$RELEASE.+\'(.+)\'/', $ver, $match) != 0) {
        $this->cartVars['dbVersion'] = $match[1];
        unset($match);
      }
    }

    $this->imagesDir = "components/com_virtuemart/shop_image";
    $this->categoriesImagesDir    = $this->imagesDir;
    $this->productsImagesDir      = $this->imagesDir;
    $this->manufacturersImagesDir = $this->imagesDir;

    if (is_dir( M1_STORE_BASE_DIR . 'images/stories/virtuemart/product')) {
      $this->imagesDir = 'images/stories/virtuemart';
      $this->productsImagesDir      = $this->imagesDir . '/product';
      $this->categoriesImagesDir    = $this->imagesDir . '/category';
      $this->manufacturersImagesDir  = $this->imagesDir . '/manufacturer';
    }
  }

}


/**
 * Class M1_Config_Adapter_Ubercart3
 */
class M1_Config_Adapter_Ubercart3 extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_Ubercart3 constructor.
   */
  public function __construct()
  {
    @include_once M1_STORE_BASE_DIR . "sites/default/settings.php";

    $url = $databases['default']['default'];

    $url['username'] = urldecode($url['username']);
    $url['password'] = isset($url['password']) ? $url['password'] : '';
    $url['database'] = urldecode($url['database']);
    if (isset($url['port'])) {
      $url['host'] = $url['host'] .':'. $url['port'];
    }

    $this->setHostPort( $url['host'] );
    $this->dbname   = ltrim( $url['database'], '/' );
    $this->username = $url['username'];
    $this->password = $url['password'];

    $this->imagesDir = "/sites/default/files/";
    if (!file_exists( M1_STORE_BASE_DIR . $this->imagesDir )) {
      $this->imagesDir = "/files";
    }

    $fileInfo = '';

    if (file_exists(M1_STORE_BASE_DIR . '/modules/ubercart/uc_cart/uc_cart.info')) {
      $fileInfo = M1_STORE_BASE_DIR . '/modules/ubercart/uc_cart/uc_cart.info';
    } elseif (file_exists(M1_STORE_BASE_DIR . '/sites/all/modules/ubercart/uc_cart/uc_cart.info')) {
      $fileInfo = M1_STORE_BASE_DIR . '/sites/all/modules/ubercart/uc_cart/uc_cart.info';
    }

    if (file_exists( $fileInfo )) {
      $str = file_get_contents( $fileInfo );
      if (preg_match('/version\s+=\s+".+-(.+)"/', $str, $match) != 0) {
        $this->cartVars['dbVersion'] = $match[1];
        unset($match);
      }
    }

    $this->categoriesImagesDir    = $this->imagesDir;
    $this->productsImagesDir      = $this->imagesDir;
    $this->manufacturersImagesDir = $this->imagesDir;
  }

}


/**
 * Class M1_Config_Adapter_Ubercart
 */
class M1_Config_Adapter_Ubercart extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_Ubercart constructor.
   */
  public function __construct()
  {
    @include_once M1_STORE_BASE_DIR . "sites/default/settings.php";

    $url = parse_url($db_url);

    $url['user'] = urldecode($url['user']);
    // Test if database url has a password.
    $url['pass'] = isset($url['pass']) ? urldecode($url['pass']) : '';
    $url['host'] = urldecode($url['host']);
    $url['path'] = urldecode($url['path']);
    // Allow for non-standard MySQL port.
    if (isset($url['port'])) {
      $url['host'] = $url['host'] .':'. $url['port'];
    }

    $this->setHostPort( $url['host'] );
    $this->dbname   = ltrim( $url['path'], '/' );
    $this->username = $url['user'];
    $this->password = $url['pass'];

    $this->imagesDir = "/sites/default/files/";
    if (!file_exists(M1_STORE_BASE_DIR . $this->imagesDir)) {
      $this->imagesDir = "/files";
    }

    if (file_exists(M1_STORE_BASE_DIR . "/modules/ubercart/uc_cart/uc_cart.info")) {
      $str = file_get_contents(M1_STORE_BASE_DIR . "/modules/ubercart/uc_cart/uc_cart.info");
      if (preg_match('/version\s+=\s+".+-(.+)"/', $str, $match) != 0) {
        $this->cartVars['dbVersion'] = $match[1];
        unset($match);
      }
    }

    $this->categoriesImagesDir    = $this->imagesDir;
    $this->productsImagesDir      = $this->imagesDir;
    $this->manufacturersImagesDir = $this->imagesDir;
  }

}



/**
 * Class M1_Config_Adapter_Tomatocart
 */
class M1_Config_Adapter_Tomatocart extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_Tomatocart constructor.
   */
  public function __construct()
  {
    $config = file_get_contents(M1_STORE_BASE_DIR . "includes/configure.php");
    preg_match("/define\(\'DB_DATABASE\', \'(.+)\'\);/", $config, $match);
    $this->dbname   = $match[1];
    preg_match("/define\(\'DB_SERVER_USERNAME\', \'(.+)\'\);/", $config, $match);
    $this->username = $match[1];
    preg_match("/define\(\'DB_SERVER_PASSWORD\', \'(.*)\'\);/", $config, $match);
    $this->password = $match[1];
    preg_match("/define\(\'DB_SERVER\', \'(.+)\'\);/", $config, $match);
    $this->setHostPort( $match[1] );

    preg_match("/define\(\'DIR_WS_IMAGES\', \'(.+)\'\);/", $config, $match);
    $this->imagesDir = $match[1];

    preg_match("/define\(\'DB_TABLE_PREFIX\', \'(.+)\'\);/", $config, $match);
    if (isset($match[1]))
      $this->tblPrefix = $match[1];

    $this->categoriesImagesDir    = $this->imagesDir.'categories/';
    $this->productsImagesDir      = $this->imagesDir.'products/';
    $this->manufacturersImagesDir = $this->imagesDir . 'manufacturers/';
    if (file_exists(M1_STORE_BASE_DIR  . "includes" . DIRECTORY_SEPARATOR . 'application_top.php')) {
      $conf = file_get_contents (M1_STORE_BASE_DIR . "includes" . DIRECTORY_SEPARATOR . "application_top.php");
      preg_match("/define\('PROJECT_VERSION.*/", $conf, $match);

      if (isset($match[0]) && !empty($match[0])) {
        preg_match("/\d.*/", $match[0], $project);
        if (isset($project[0]) && !empty($project[0])) {
          $version = $project[0];
          $version = str_replace(array(" ","-","_","'",");"), "", $version);
          if ($version != '') {
            $this->cartVars['dbVersion'] = strtolower($version);
          }
        }
      } else {
        //if another version
        if (file_exists(M1_STORE_BASE_DIR  . "includes" . DIRECTORY_SEPARATOR . 'version.php')) {
          @require_once M1_STORE_BASE_DIR . "includes" . DIRECTORY_SEPARATOR . "version.php";
          if (defined('PROJECT_VERSION') && PROJECT_VERSION != '' ) {
            $version = PROJECT_VERSION;
            preg_match("/\d.*/", $version, $vers);
            if (isset($vers[0]) && !empty($vers[0])) {
              $version = $vers[0];
              $version = str_replace(array(" ","-","_"), "", $version);
              if ($version != '') {
                $this->cartVars['dbVersion'] = strtolower($version);
              }
            }
          }
        }
      }
    }
  }

}



/**
 * Class M1_Config_Adapter_Shopware
 */
class M1_Config_Adapter_Shopware extends M1_Config_Adapter
{

  const ERROR_CODE_SUCCESS = 0;
  const ERROR_CODE_INTERNAL_ERROR = 2;

  /**
   * M1_Config_Adapter_Shopware constructor.
   */
  public function __construct()
  {
    if (file_exists(M1_STORE_BASE_DIR  . 'engine/Shopware/Kernel.php')) { //shopware version < 6
      $file = file_get_contents(M1_STORE_BASE_DIR  . 'engine/Shopware/Kernel.php');
      if (preg_match('/\'version\'\s*=>\s*\'([0-9.]+)\'/', $file, $matches) && isset($matches[1])) {
        $this->cartVars['dbVersion'] = $matches[1];
      }

      if (!$this->cartVars['dbVersion'] && file_exists(M1_STORE_BASE_DIR  . 'engine/Shopware/Application.php')) {
        $file = file_get_contents(M1_STORE_BASE_DIR  . 'engine/Shopware/Application.php');
        if (preg_match('/const\s+VERSION\s*=\s*[\'"]([0-9.]+)[\'"]/', $file, $matches) && isset($matches[1])) {
          $this->cartVars['dbVersion'] = $matches[1];
        }
      }

      $environment = getenv('SHOPWARE_ENV') ?: getenv('REDIRECT_SHOPWARE_ENV') ?: 'production';
      $timeZone = null;
      if (file_exists(M1_STORE_BASE_DIR  . 'engine/Shopware/Configs/config_' . $environment . '.php')) {
        $file  = file_get_contents(M1_STORE_BASE_DIR  . 'engine/Shopware/Configs/config_' . $environment . '.php');
        if (preg_match('/["\']date\.timezone["\']\s?=>\s?["\'](.*)?["\']/', $file, $matches) && isset($matches[1])) {
          $timeZone = $matches[1];
        }
      }

      if (!$timeZone && file_exists(M1_STORE_BASE_DIR  . 'engine/Shopware/Configs/config.php')) {
        $file  = file_get_contents(M1_STORE_BASE_DIR  . 'engine/Shopware/Configs/config.php');
        if (preg_match('/["\']date\.timezone["\']\s?=>\s?["\'](.*)?["\']/', $file, $matches) && isset($matches[1])) {
          $timeZone = $matches[1];
        }
      }

      if (!$timeZone && file_exists(M1_STORE_BASE_DIR  . 'engine/Shopware/Configs/Default.php')) {
        $file  = file_get_contents(M1_STORE_BASE_DIR  . 'engine/Shopware/Configs/Default.php');
        if (preg_match('/["\']date\.timezone["\']\s?=>\s?["\'](.*)?["\']/', $file, $matches) && isset($matches[1])) {
          $timeZone = $matches[1];
        }
      } else {
        try {
          $timeZone = date_default_timezone_get();
        } catch (Exception $e) {
          $timeZone = 'UTC';
        }
      }

      $configs = include(M1_STORE_BASE_DIR . "config.php");
      $this->setHostPort($configs['db']['host']);
      $this->username = $configs['db']['username'];
      $this->password = $configs['db']['password'];
      $this->dbname   = $configs['db']['dbname'];
      $this->tblPrefix = 's_';
      $this->timeZone = $timeZone;
    } else {
      if (file_exists(M1_STORE_BASE_DIR . 'vendor/autoload.php')) {
        $m1StoreBaseDir = M1_STORE_BASE_DIR;
      } else {
        $m1StoreBaseDir = realpath(M1_STORE_BASE_DIR . '..') . DIRECTORY_SEPARATOR;
      }

      require $m1StoreBaseDir . 'vendor/autoload.php';

      $shopwareVersion = $composerFile = '';

      if (class_exists('PackageVersions\Versions')) {
        preg_match('/(?:v)?\s*((?:[0-9]+\.?)+)/', \PackageVersions\Versions::getVersion('shopware/core'), $matches);
      } elseif ((class_exists('Composer\InstalledVersions'))) {
        preg_match('/(?:v)?\s*((?:[0-9]+\.?)+)/', \Composer\InstalledVersions::getVersion('shopware/core'), $matches);
      }


      if (isset($matches[1])) {
        $shopwareVersion = $matches[1];
      } elseif (file_exists(M1_STORE_BASE_DIR . 'composer.json')) {
        $composerFile = file_get_contents(M1_STORE_BASE_DIR . 'composer.json');
      } elseif (file_exists(M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR . 'composer.json')) {
        $composerFile = file_get_contents(M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR . 'composer.json');
      }

      if ($composerFile) {
        $content = json_decode($composerFile, true);
        $shopwareVersion = str_replace(['~', '^', 'v'], '', isset($content['require']['shopware/core']) ? $content['require']['shopware/core'] : '');
      }

      if (empty($shopwareVersion)) {
        die('ERROR_DETECTING_PLATFORM_VERSION');
      }

      $this->cartVars['dbVersion'] = $shopwareVersion;
      $this->timeZone = 'UTC';

      $envLoader = new Symfony\Component\Dotenv\Dotenv();
      $config = $envLoader->parse(file_get_contents($m1StoreBaseDir . '.env'));

      if (file_exists($m1StoreBaseDir . '.env.local')) {
        $localConfig = $envLoader->parse(file_get_contents($m1StoreBaseDir . '.env.local'));
      }

      $params = [];

      if (isset($localConfig['DATABASE_URL'])) {
        $databaseUrl = $localConfig['DATABASE_URL'];
      } else {
        $databaseUrl = $config['DATABASE_URL'];
      }

      foreach (parse_url($databaseUrl) as $param => $value) {
        if (is_string($value)) {
          $params[$param] = rawurldecode($value);
        } else {
          $params[$param] = $value;
        }
      }

      $defaultCDNStrategy = 'physical_filename';

      if (file_exists(M1_STORE_BASE_DIR . 'config/services/defaults.xml')) {
        $defaultsContent = file_get_contents(M1_STORE_BASE_DIR . 'config/services/defaults.xml');
      } elseif (file_exists(M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR . 'config/services/defaults.xml')) {
        $defaultsContent = file_get_contents(M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR . 'config/services/defaults.xml');
      }

      if (!empty($defaultsContent)) {
        if (preg_match('/<parameter key="default_cdn_strategy">(.*?)<\/parameter>/', $defaultsContent, $matches) && !empty($matches[1])) {
          $matches[1] = strtolower($matches[1]);

          if (in_array($matches[1], ['physical_filename', 'filename', 'id', 'plain'])) {
            $defaultCDNStrategy = $matches[1];
          }
        }
      }

      $this->cartVars['сdn_strategy'] = isset($config['SHOPWARE_CDN_STRATEGY_DEFAULT']) ? $config['SHOPWARE_CDN_STRATEGY_DEFAULT'] : $defaultCDNStrategy;

      $port = isset($params['port']) ? ':' . $params['port'] : '';
      $this->setHostPort($params['host'] . $port);

      $this->dbname = ltrim($params['path'], '/');
      $this->username = isset($params['user']) ? $params['user'] : '';
      $this->password = isset($params['pass']) ? $params['pass'] : '';
    }
  }

  /**
   * @param array $data Contain request params and payload
   *
   * @return mixed
   * @throws Exception
   */
  public function productAddAction($data)
  {
    return $this->_importEntity($data);
  }

  /**
   * @param array $a2cData Contain request params and payload
   *
   * @return mixed
   * @throws Exception
   */
  public function productUpdateAction($a2cData)
  {
    return $this->_importEntity($a2cData);
  }

  /**
   * @param array $a2cData Contain request params and payload
   *
   * @return mixed
   * @throws Exception
   */
  public function apiSend($a2cData)
  {
    return $this->_importEntity($a2cData);
  }

  /**
   * @param array $data Data to import
   *
   * @return array
   */
  private function _importEntity($data)
  {
    $response = array('error' => null, 'data' => false);
    try {
      if (file_exists(M1_STORE_BASE_DIR . '.env.local')) {
        (new \Symfony\Component\Dotenv\Dotenv(true))->load(M1_STORE_BASE_DIR . '.env.local');
        $storeRoot = M1_STORE_BASE_DIR;
      } elseif (file_exists(M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR . '.env.local')) {
        (new \Symfony\Component\Dotenv\Dotenv(true))->load(M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR . '.env.local');
        $storeRoot = M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR;
      } elseif (file_exists(M1_STORE_BASE_DIR . '.env')) {
        (new \Symfony\Component\Dotenv\Dotenv(true))->load(M1_STORE_BASE_DIR . '.env');
        $storeRoot = M1_STORE_BASE_DIR;
      } elseif(file_exists(M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR . '.env')) {
        (new \Symfony\Component\Dotenv\Dotenv(true))->load(M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR . '.env');
        $storeRoot = M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR;
      } else {
        throw new \Exception('File \'.env\' not found');
      }

      require $storeRoot . 'vendor/autoload.php';

      if (function_exists('curl_version')) {
        $response['data'] = $this->_sendRequestWithCurl($data);
      } elseif (class_exists('\GuzzleHttp\Client')) {
        $response['data'] = $this->_sendRequestWithGuzzle($data);
      } else {
        throw new Exception('Http client not found');
      }

    } catch (Exception $e) {
      $response['error']['message'] = $e->getMessage();
      $response['error']['code'] = $e->getCode();
    }

    return $response;
  }

  /**
   * @param array $data Contain request params and payload
   *
   * @return bool
   * @throws Exception
   */
  private function _sendRequestWithCurl($data)
  {
    $shopwareVersion = $this->cartVars['dbVersion'];
    $headers = array(
      'Content-Type: application/json',
      'Authorization: ' . $this->_getToken($data['meta']['user_id'])
    );

    if (isset($data['headers'])) {
      $headers = array_merge($headers, $data['headers']);
    }

    $ch = curl_init();

    try {
      $scriptName = basename($_SERVER['SCRIPT_FILENAME']);
    } catch (\Exception $e) {
      $scriptName = 'index.php';
    }

    if (version_compare($shopwareVersion, '6.4.0.0', '>=')) {
      $apiVersion = '/api/';
    } else {
      $apiVersion = '/api/v2/';
    }

    $uri = $_SERVER['SERVER_NAME'] . str_replace('/' . $scriptName, '', $_SERVER['PHP_SELF']);
    $uri = str_replace('/bridge2cart', '', $uri);

    if ($data['method'] === 'POST') {
      curl_setopt($ch, CURLOPT_URL, $uri . $apiVersion . $data['entity']);
    } elseif ($data['method'] === 'DELETE') {
      curl_setopt($ch, CURLOPT_URL, $uri . $apiVersion . $data['entity']);
      curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    } else {
      $url = $uri . $apiVersion . $data['entity'] . '/' . $data['meta']['entity_id'];
      curl_setopt($ch, CURLOPT_URL, $url);
      curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $data['method']);
    }

    curl_setopt($ch, CURLOPT_POSTFIELDS, $data['payload']);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_VERBOSE, 1);
    curl_setopt($ch, CURLOPT_HEADER, 1);

    $res = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $body = json_decode(substr($res, curl_getinfo($ch, CURLINFO_HEADER_SIZE)));

    curl_close($ch);

    if ($httpCode == "204") {
      return true;
    } elseif ($httpCode == '200') {
      return $body;
    } else {
      $message = '';
      if (isset($body->errors[0]->detail)) {
        $message = 'Error message: ' . $body->errors[0]->detail;
      }

      throw new Exception('Bridge curl failed. Not expected http code. ' . $message, $httpCode);
    }
  }

  /**
   * @param array $data Contain request params and payload
   *
   * @return bool
   * @throws Exception
   */
  private function _sendRequestWithGuzzle($data)
  {
    $shopwareVersion = $this->cartVars['dbVersion'];
    $headers = array(
      'Content-Type' => 'application/json',
      'Accept' => 'application/json',
      'Authorization' => $this->_getToken($data['meta']['user_id'])
    );

    if (isset($data['headers'])) {
      $headers = array_merge($headers, $data['headers']);
    }

    $client = new \GuzzleHttp\Client();
    $message = '';

    try {
      $scriptName = basename($_SERVER['SCRIPT_FILENAME']);
    } catch (\Exception $e) {
      $scriptName = 'index.php';
    }

    if (version_compare($shopwareVersion, '6.4.0.0', '>=')) {
      $apiVersion = '/api/';
    } else {
      $apiVersion = '/api/v2/';
    }

    $uri = $_SERVER['SERVER_NAME'] . str_replace('/' . $scriptName, '', $_SERVER['PHP_SELF']);
    $uri = str_replace('/bridge2cart', '', $uri);

    try {
      $options = ['body' => $data['payload'], 'headers' => $headers];

      if ($data['method'] === 'POST') {
        $response = $client->post(
          $uri . $apiVersion . $data['entity'],
          $options
        );
      } elseif ($data['method'] === 'DELETE') {
        $response = $client->delete(
          $uri . $apiVersion . $data['entity']
        );
      } elseif ($data['method'] === 'GET') {
        $response = $client->get(
          $uri . $apiVersion . $data['entity'] . '/' . $data['meta']['entity_id'],
          $options
        );
      } else {
        $response = $client->put(
          $uri . $apiVersion . $data['entity'] . '/' . $data['meta']['entity_id'],
          $options
        );
      }
    } catch (GuzzleHttp\Exception\RequestException $e) {
      if ($e->hasResponse()) {
        $response = $e->getResponse();
        $body = json_decode(((string)$response->getBody()), true);

        if (isset($body['errors'][0]['detail'])) {
          $message = 'Error message: ' . $body['errors'][0]['detail'];
        }
      } else {
        throw new Exception('Guzzle failed');
      }
    }

    if ($response->getStatusCode() === 204) {
      return true;
    } elseif ($response->getStatusCode() === 200) {
      return json_decode(((string)$response->getBody()), true);
    } else {
      throw new Exception('Not expected http code from shopware. ' . $message, $response->getStatusCode());
    }
  }

  /**
   * @param string $userId Admin user id
   *
   * @return string
   * @throws Exception
   */
  private function _getToken($userId)
  {
    $shopwareVersion = $this->cartVars['dbVersion'];

    if (version_compare($shopwareVersion, '6.4.0.0', '>=')) {
      $dateInterval = (new \DateTimeImmutable())->add(new \DateInterval('PT1H'));
    } else {
      $dateInterval = (new DateTime())->add(new DateInterval('PT1H'));
    }

    if (version_compare($shopwareVersion, '6.7.0.0', '>=')) {
      try {
        $key = new \Shopware\Core\Framework\Api\OAuth\FakeCryptKey(
          \Shopware\Core\Framework\Api\OAuth\JWTConfigurationFactory::createJWTConfiguration()
        );
      } catch (Exception $e) {
        throw new Exception('APP_SECRET variable is not set in the environment');
      }
    } else {
      if (file_exists(M1_STORE_BASE_DIR . 'config/jwt/private.pem')) {
        $storeRoot = M1_STORE_BASE_DIR;
      } elseif (file_exists(M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR . 'config/jwt/private.pem')) {
        $storeRoot = M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR;
      } else {
        throw new Exception('File \'private.pem\' not found');
      }

      $key = new \League\OAuth2\Server\CryptKey($storeRoot . 'config/jwt/private.pem', 'shopware', false);
    }

    $connection = \Shopware\Core\Kernel::getConnection();
    $client = new \Shopware\Core\Framework\Api\OAuth\Client\ApiClient('administration', true);

    $scopeRepo = new \Shopware\Core\Framework\Api\OAuth\ScopeRepository(array(), $connection);
    $finalizedScopes = $scopeRepo->finalizeScopes(array(), 'password', $client, $userId);

    $tokenRepo = new \Shopware\Core\Framework\Api\OAuth\AccessTokenRepository();
    $accessToken = $tokenRepo->getNewToken($client, $finalizedScopes, $userId);

    $writeScope = new \Shopware\Core\Framework\Api\OAuth\Scope\WriteScope();
    $accessToken->setClient($client);
    $accessToken->setUserIdentifier($userId);
    $accessToken->addScope($writeScope);
    $accessToken->setExpiryDateTime($dateInterval);

    if (version_compare($shopwareVersion, '6.4.0.0', '<')) {
      return 'Bearer ' . (string)$accessToken->convertToJWT($key);
    } else {
      $accessToken->setPrivateKey($key);

      if (version_compare($shopwareVersion, '6.7.0.0', '>=')) {
        return 'Bearer ' . (string)$accessToken->toString();
      } else {
        return 'Bearer ' . (string)$accessToken->__toString();
      }
    }
  }

  /**
   * @param array $a2cData Data
   *
   * @return array|mixed
   */
  public function orderCalculate($a2cData)
  {
    $response = [
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => [],
    ];

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      $storeRoot = $this->_getStoreRoot();
      $environment = getenv('APP_ENV');

      if (empty($environment)) {
        if (!empty($_ENV['APP_ENV'])) {
          $environment = $_ENV['APP_ENV'];
        } else {
          $environment = 'prod';
        }
      }

      $debug = getenv('APP_DEBUG');

      if (empty($debug)) {
        if (!empty($_ENV['APP_DEBUG'])) {
          $debug = $_ENV['APP_DEBUG'];
        } else {
          $debug = false;
        }
      }

      $debug = (bool)$debug;

      // Load Shopware core
      if (version_compare($this->cartVars['dbVersion'], '6.6.0.0', '>=')) {
        $kernelLoader = require $storeRoot . '/public/index.php';
        $kernel = $kernelLoader([
          'APP_ENV'   => $environment,
          'APP_DEBUG' => $debug,
        ]);
      } else {
        $classLoader = require $storeRoot . '/vendor/autoload.php';
        $dotEnv = new Symfony\Component\Dotenv\Dotenv();

        if (method_exists($dotEnv, 'bootEnv')) {
          $dotEnv->bootEnv($storeRoot . '/.env');
        } else {
          $dotEnv->load($storeRoot . '/.env');

          foreach ($_ENV as $k => $v) {
            putenv("$k=$v");
          }
        }

        $dbUrl = getenv('DATABASE_URL');

        if (empty($dbUrl) && !empty($_ENV['DATABASE_URL'])) {
          $dbUrl = $_ENV['DATABASE_URL'];
        }

        if (empty($dbUrl)) {
          $connection = Doctrine\DBAL\DriverManager::getConnection([
            'driver'   => 'pdo_mysql',
            'host'     => $this->host,
            'port'     => $this->port,
            'user'     => $this->username,
            'password' => $this->password,
            'dbname'   => $this->dbname,
          ]);
        } else {
          $connection = Doctrine\DBAL\DriverManager::getConnection(['url' => $dbUrl]);
        }

        $pluginLoader = new Shopware\Core\Framework\Plugin\KernelPluginLoader\DbalKernelPluginLoader($classLoader, null, $connection);
        $args = [
          $environment,
          $debug,
          $pluginLoader,
          md5($storeRoot . $environment)
        ];

        if (version_compare($this->cartVars['dbVersion'], '6.4.0.0', '<')) {
          $args = array_merge(
            $args,
            [
              Shopware\Core\Kernel::SHOPWARE_FALLBACK_VERSION,
              $connection,
              $storeRoot,
            ]
          );
        }

        $kernel = new Shopware\Core\Kernel(...$args);
      }

      $kernel->boot();
      $container = $kernel->getContainer();

      // Get containers
      $serviceContainer = $container->get('service_container');
      $customerRepository = $container->get('customer.repository');
      $salutationRepository = $container->get('salutation.repository');
      $customerGroupRepository = $container->get('customer_group.repository');
      $countryRepository = $container->get('country.repository');
      $stateRepository = $container->get('country_state.repository');
      $promotionRepository = $container->get('promotion.repository');
      $taxRepository = $container->get('tax.repository');
      $productRepository = $container->get('product.repository');
      $currencyRepository = $container->get('currency.repository');
      $addressRepository = $container->get('customer_address.repository');
      $paymentMethodRepository = $container->get('payment_method.repository');

      // Load Shopware services
      if (version_compare($this->cartVars['dbVersion'], '6.2.0.0', '>=')) {
        $shippingRoute = $container->get(Shopware\Core\Checkout\Shipping\SalesChannel\ShippingMethodRoute::class);
      } else {
        $shippingRoute = $container->get(Shopware\Core\Checkout\Shipping\SalesChannel\SalesChannelShippingMethodDefinition::class);
      }

      $cartService = $serviceContainer->get(Shopware\Core\Checkout\Cart\SalesChannel\CartService::class);

      $taxFilters = [
        new Shopware\Core\System\Tax\TaxRuleType\EntireCountryRuleTypeFilter(),
        new Shopware\Core\System\Tax\TaxRuleType\IndividualStatesRuleTypeFilter(),
        new Shopware\Core\System\Tax\TaxRuleType\ZipCodeRangeRuleTypeFilter(),
        new Shopware\Core\System\Tax\TaxRuleType\ZipCodeRuleTypeFilter(),
      ];

      if (version_compare($this->cartVars['dbVersion'], '6.4.0.0', '<')) {
        $contextFactory = new Shopware\Core\System\SalesChannel\Context\SalesChannelContextFactory(
          $container->get('sales_channel.repository'),
          $currencyRepository,
          $customerRepository,
          $customerGroupRepository,
          $countryRepository,
          $taxRepository,
          $addressRepository,
          $paymentMethodRepository,
          $container->get('shipping_method.repository'),
          $connection,
          $stateRepository,
          new Shopware\Core\Checkout\Cart\Tax\TaxDetector(),
          $taxFilters,
          $container->get('event_dispatcher')
        );
      } elseif (version_compare($this->cartVars['dbVersion'], '6.6.0.0', '<')) {
        $currencyCountryRepository = $container->get('currency_country_rounding.repository');
        $baseContextFactory = new Shopware\Core\System\SalesChannel\Context\BaseContextFactory(
          $container->get('sales_channel.repository'),
          $currencyRepository,
          $customerGroupRepository,
          $countryRepository,
          $taxRepository,
          $paymentMethodRepository,
          $container->get('shipping_method.repository'),
          $connection,
          $stateRepository,
          $currencyCountryRepository
        );
        $contextFactory = new Shopware\Core\System\SalesChannel\Context\SalesChannelContextFactory(
          $customerRepository,
          $customerGroupRepository,
          $addressRepository,
          $paymentMethodRepository,
          new Shopware\Core\Checkout\Cart\Tax\TaxDetector(),
          $taxFilters,
          $container->get('event_dispatcher'),
          $currencyCountryRepository,
          $baseContextFactory
        );
      } else {
        $contextFactory = $container->get(Shopware\Core\System\SalesChannel\Context\SalesChannelContextFactory::class);
      }

      $defaultContext = Shopware\Core\Framework\Context::createDefaultContext();
      $saleChannelId = strtolower($a2cData['store_id']);

      $contextOptions = [];

      if (!empty($a2cData['currency'])) {
        $currency = $currencyRepository->search(
          new Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria([strtolower($a2cData['currency'])]),
          $defaultContext
        )->first();

        if (!empty($currency)) {
          $contextOptions = ['currencyId' => $currency->getId()];
        }
      }

      // Generate base context, token must be unique for all method calls
      $baseSalesFactoryContext = $contextFactory->create(Shopware\Core\Framework\Uuid\Uuid::randomHex(), $saleChannelId, $contextOptions);

      // Search customer by email
      $customerSearchResult = $customerRepository->search(
        (new Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria())->addFilter(
          new Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter('email', $a2cData['email'])
        ),
        $defaultContext
      );
      $customer = $customerSearchResult->first();

      // Get default salutation ID
      $salutationId = $salutationRepository->searchIds(
        (new Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria())->addFilter(
          new Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter('salutationKey', 'not_specified')
        ),
        $defaultContext
      )->firstId();

      $shippingAddress = new Shopware\Core\Checkout\Customer\Aggregate\CustomerAddress\CustomerAddressEntity();

      $shippingAddress->setId(Shopware\Core\Framework\Uuid\Uuid::randomHex());
      $shippingAddress->setFirstName($a2cData['shipping']['first_name']);
      $shippingAddress->setLastName($a2cData['shipping']['last_name']);
      $shippingAddress->setStreet($a2cData['shipping']['street']);
      $shippingAddress->setZipcode($a2cData['shipping']['zipcode']);
      $shippingAddress->setCity($a2cData['shipping']['city']);
      $shippingAddress->setCountryId(strtolower($a2cData['shipping']['country_id']));
      $shippingAddress->setCountry(
        $countryRepository->search(
          new Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria([$shippingAddress->getCountryId()]),
          $defaultContext
        )->first()
      );

      if (!empty($salutationId)) {
        $shippingAddress->setSalutationId($salutationId);
      }

      if (!empty($a2cData['shipping']['company'])) {
        $shippingAddress->setCompany($a2cData['shipping']['company']);
      }

      if (!empty($a2cData['shipping']['country_state_id'])) {
        $shippingAddress->setCountryStateId(strtolower($a2cData['shipping']['country_state_id']));
        $shippingAddress->setCountryState(
          $stateRepository->search(
            new Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria([$shippingAddress->getCountryStateId()]),
            $defaultContext
          )->first()
        );
      }

      $billingAddress = new Shopware\Core\Checkout\Customer\Aggregate\CustomerAddress\CustomerAddressEntity();

      $billingAddress->setId(Shopware\Core\Framework\Uuid\Uuid::randomHex());
      $billingAddress->setFirstName($a2cData['billing']['first_name']);
      $billingAddress->setLastName($a2cData['billing']['last_name']);
      $billingAddress->setStreet($a2cData['billing']['street']);
      $billingAddress->setZipcode($a2cData['billing']['zipcode']);
      $billingAddress->setCity($a2cData['billing']['city']);
      $billingAddress->setCountryId(strtolower($a2cData['billing']['country_id']));
      $billingAddress->setCountry(
        $countryRepository->search(
          new Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria([$billingAddress->getCountryId()]),
          $defaultContext
        )->first()
      );

      if (!empty($salutationId)) {
        $billingAddress->setSalutationId($salutationId);
      }

      if (!empty($a2cData['billing']['company'])) {
        $billingAddress->setCompany($a2cData['billing']['company']);
      }

      if (!empty($a2cData['billing']['country_state_id'])) {
        $billingAddress->setCountryStateId(strtolower($a2cData['billing']['country_state_id']));
        $billingAddress->setCountryState(
          $stateRepository->search(
            new Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria([$billingAddress->getCountryStateId()]),
            $defaultContext
          )->first()
        );
      }

      if (empty($customer)) {
        $customer = new Shopware\Core\Checkout\Customer\CustomerEntity();

        $customer->setId(Shopware\Core\Framework\Uuid\Uuid::randomHex());
        $customer->setGuest(true);
        $customer->setFirstName($a2cData['shipping']['first_name']);
        $customer->setLastName($a2cData['shipping']['last_name']);
        $customer->setEmail($a2cData['email']);
        $customer->setActiveBillingAddress($billingAddress);
        $customer->setActiveShippingAddress($shippingAddress);
        $customer->setDefaultBillingAddress($billingAddress);
        $customer->setDefaultShippingAddress($shippingAddress);

        if (method_exists($customer, 'setAccountType')) {
          $customer->setAccountType('private');
        }

        // Get default customer group ID
        $customerGroupId = $customerGroupRepository->searchIds(
          (new Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria())->addFilter(
            new Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter('displayGross', true)
          ),
          $defaultContext
        )->firstId();

        if (!empty($customerGroupId)) {
          $customer->setGroupId($customerGroupId);
        }

        $paymentMethods = $paymentMethodRepository->search(
          new Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria(),
          $defaultContext
        );
        $defaultPaymentMethod = $paymentMethods->first();

        if (empty($defaultPaymentMethod)) {
          $defaultPaymentMethod = Shopware\Core\Framework\Uuid\Uuid::randomHex();
        } else {
          $defaultPaymentMethod = $defaultPaymentMethod->getId();
        }

        $billingAddressData = [
          'id'           => $billingAddress->getId(),
          'customerId'   => $customer->getId(),
          'salutationId' => $salutationId,
          'firstName'    => $billingAddress->getFirstName(),
          'lastName'     => $billingAddress->getLastName(),
          'street'       => $billingAddress->getStreet(),
          'city'         => $billingAddress->getCity(),
          'zipcode'      => $billingAddress->getZipcode(),
          'countryId'    => $billingAddress->getCountryId(),
        ];

        $shippingAddressData = [
          'id'           => $shippingAddress->getId(),
          'customerId'   => $customer->getId(),
          'salutationId' => $salutationId,
          'firstName'    => $shippingAddress->getFirstName(),
          'lastName'     => $shippingAddress->getLastName(),
          'street'       => $shippingAddress->getStreet(),
          'city'         => $shippingAddress->getCity(),
          'zipcode'      => $shippingAddress->getZipcode(),
          'countryId'    => $shippingAddress->getCountryId(),
        ];

        $customerData = [
          'id'                       => $customer->getId(),
          'firstName'                => $customer->getFirstName(),
          'lastName'                 => $customer->getLastName(),
          'email'                    => $customer->getEmail(),
          'salesChannelId'           => $saleChannelId,
          'salutationId'             => $shippingAddress->getSalutationId(),
          'customerNumber'           => 'GUEST-' . time(),
          'defaultBillingAddressId'  => $billingAddress->getId(),
          'defaultShippingAddressId' => $shippingAddress->getId(),
          'guest'                    => true,
          'groupId'                  => $customer->getGroupId(),
          'defaultPaymentMethodId'   => $defaultPaymentMethod,
        ];

        if (version_compare($this->cartVars['dbVersion'], '6.3.0.0', '>=')) {
          $customerRepository->create([array_merge($customerData, ['addresses' => [$billingAddressData, $shippingAddressData]])], $defaultContext);
        } else {
          $customerRepository->create([$customerData], $defaultContext);
          $addressRepository->create([$billingAddressData], $defaultContext);
          $addressRepository->create([$shippingAddressData], $defaultContext);
        }
      } else {
        $customer->setActiveBillingAddress($billingAddress);
        $customer->setActiveShippingAddress($shippingAddress);
        $customer->setDefaultBillingAddress($billingAddress);
        $customer->setDefaultShippingAddress($shippingAddress);
      }

      $shippingLocation = Shopware\Core\Checkout\Cart\Delivery\Struct\ShippingLocation::createFromAddress($shippingAddress);
      $contextTaxRules = $baseSalesFactoryContext->getTaxRules()->getElements();

      if (!empty($contextTaxRules)) {
        foreach ($contextTaxRules as $contextTaxRule) {
          $taxRules = $contextTaxRule->getRules();

          if ($taxRules === null) {
            continue;
          }

          $taxRules = $taxRules->filter(
            function (Shopware\Core\System\Tax\Aggregate\TaxRule\TaxRuleEntity $taxRule) use ($customer, $shippingLocation, $taxFilters) {
              foreach ($taxFilters as $ruleTypeFilterClass) {
                if ($ruleTypeFilterClass->match($taxRule, $customer, $shippingLocation)) {
                  return true;
                }
              }

              return false;
            }
          );

          if (version_compare($this->cartVars['dbVersion'], '6.6.0.0', '>=')) {
            $matchingRules = new Shopware\Core\System\Tax\Aggregate\TaxRule\TaxRuleCollection();
            $taxRule = $taxRules->highestTypePosition();

            if (!$taxRule) {
              $contextTaxRule->setRules($matchingRules);

              continue;
            }

            $taxRules = $taxRules->filterByTypePosition($taxRule->getType()->getPosition());
            $taxRule = $taxRules->latestActivationDate();
          } else {
            $taxRules->sortByTypePosition();
            $taxRule = $taxRules->first();

            $matchingRules = new Shopware\Core\System\Tax\Aggregate\TaxRule\TaxRuleCollection();
          }

          if ($taxRule) {
            $matchingRules->add($taxRule);
          }

          $contextTaxRule->setRules($matchingRules);
        }
      }

      $shippingRates = [];
      $taxRulesCollection = new Shopware\Core\System\Tax\TaxCollection($contextTaxRules);
      $getContext = function ($baseContext, $shippingMethod) use ($customer, $shippingLocation, $taxRulesCollection) {
        if (version_compare($this->cartVars['dbVersion'], '6.4.0.0', '>=')) {
          $args = [
            $baseContext->getContext(),
            $baseContext->getToken(),
            $baseContext->getDomainId(),
            $baseContext->getSalesChannel(),
            $baseContext->getCurrency(),
            $baseContext->getCurrentCustomerGroup(),
          ];

          if (version_compare($this->cartVars['dbVersion'], '6.7.0.0', '>=')) {
            $args = array_merge(
              $args,
              [
                $taxRulesCollection,
                $baseContext->getPaymentMethod(),
                $shippingMethod,
                $shippingLocation,
                $customer,
                $baseContext->getCurrency()->getItemRounding(),
                $baseContext->getCurrency()->getTotalRounding(),
                $baseContext->getLanguageInfo(),
                method_exists($baseContext, 'getAreaRuleIds') ? $baseContext->getAreaRuleIds() : [],
                $baseContext->getMeasurementSystem(),
              ]
            );
          } elseif (version_compare($this->cartVars['dbVersion'], '6.5.0.0', '>=')) {
            $args = array_merge(
              $args,
              [
                $taxRulesCollection,
                $baseContext->getPaymentMethod(),
                $shippingMethod,
                $shippingLocation,
                $customer,
                $baseContext->getCurrency()->getItemRounding(),
                $baseContext->getCurrency()->getTotalRounding(),
                method_exists($baseContext, 'getAreaRuleIds') ? $baseContext->getAreaRuleIds() : [],
              ]
            );
          } else {
            $args = array_merge(
              $args,
              [
                $baseContext->getFallbackCustomerGroup(),
                $taxRulesCollection,
                $baseContext->getPaymentMethod(),
                $shippingMethod,
                $shippingLocation,
                $customer,
                $baseContext->getCurrency()->getItemRounding(),
                $baseContext->getCurrency()->getTotalRounding(),
                $baseContext->getRuleIds(),
              ]
            );
          }
        } else {
          $args = [
            $baseContext->getContext(),
            $baseContext->getToken(),
            $baseContext->getSalesChannel(),
            $baseContext->getCurrency(),
            $baseContext->getCurrentCustomerGroup(),
            $baseContext->getFallbackCustomerGroup(),
            $taxRulesCollection,
            $baseContext->getPaymentMethod(),
            $shippingMethod,
            $shippingLocation,
            $customer,
            $baseContext->getRuleIds(),
          ];
        }

        return new Shopware\Core\System\SalesChannel\SalesChannelContext(...$args);
      };

      // Update context with customer data
      $context = $getContext($baseSalesFactoryContext, $baseSalesFactoryContext->getShippingMethod());

      // Create an empty cart
      // Be careful, every action with the basket rewrites its contents.
      // The order of interaction with the basket (adding products, delivery methods, coupons, etc.) is important.
      $cart = $cartService->getCart($baseSalesFactoryContext->getToken(), $context);
      $products = [];
      $taxLines = [];
      $subtotal = 0;
      $totalTax = 0;
      $taxIncluded = $cart->getPrice()->getTaxStatus() === 'gross';
      $contextSalesChannel = $context->getSalesChannel();

      if (method_exists($contextSalesChannel, 'getMeasurementUnits')) {
        $weightUnit = $context->getSalesChannel()->getMeasurementUnits()->getUnit('weight');
      } else {
        $weightUnit = 'kg';
      }

      // Add products to the cart
      foreach ($a2cData['items'] as $item) {
        $idInLowercase = strtolower($item['product_id']);
        $itemObject = new Shopware\Core\Checkout\Cart\LineItem\LineItem(
          Shopware\Core\Framework\Uuid\Uuid::randomHex(),
          Shopware\Core\Checkout\Cart\LineItem\LineItem::PRODUCT_LINE_ITEM_TYPE,
          $idInLowercase,
          $item['quantity']
        );
        $itemObject->setRemovable(true);
        $itemObject->setStackable(true);
        $cart = $cartService->add($cart, $itemObject, $context);

        $cartProducts = $cart->getLineItems()->filterType(Shopware\Core\Checkout\Cart\LineItem\LineItem::PRODUCT_LINE_ITEM_TYPE)->getElements();
        $itemAddedToCart = false;

        if (!empty($cartProducts)) {
          foreach ($cartProducts as $cartProduct) {
            if ($cartProduct->getReferencedId() === $idInLowercase) {
              $priceData = $cartProduct->getPrice();
              $calculatedTaxes = $priceData->getCalculatedTaxes();
              $tax = 0;
              $taxRate = 0;
              $itemTax = 0;
              $quantity = $cartProduct->getQuantity();
              $id = $cartProduct->getReferencedId();

              if (version_compare($this->cartVars['dbVersion'], '6.2.0.0', '<')) {
                $itemData = $productRepository->search(
                  new Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria([$id]),
                  $defaultContext
                )->first();

                if (empty($itemData)) {
                  $parentId = null;
                  $taxId = Shopware\Core\Framework\Uuid\Uuid::randomHex(); // Fallback valid ID
                } else {
                  $parentId = $itemData->getParentId();
                  $taxId = $itemData->getTaxId();

                  if (empty($taxId)) {
                    $taxId = Shopware\Core\Framework\Uuid\Uuid::randomHex(); // Fallback valid ID
                  }
                }
              } else {
                $taxId = $cartProduct->getPayloadValue('taxId');
                $parentId = $cartProduct->getPayloadValue('parentId');
              }

              $taxData = $taxRepository->search(
                new Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria([$taxId]),
                $defaultContext
              )->first();

              if (!empty($calculatedTaxes)) {
                foreach ($calculatedTaxes->getElements() as $calculatedTax) {
                  $taxValue = $calculatedTax->getTax();

                  if ($taxValue) {
                    $tax += $taxValue;
                    $taxRate += $calculatedTax->getTaxRate();
                  }
                }
              }

              if ($tax > 0) {
                if (empty($taxData)) {
                  $taxName = 'Tax ' . $taxRate . '%';
                } else {
                  $taxName = $taxData->getName();
                }

                $taxHash = md5($taxName);

                if (empty($taxLines[$taxHash])) {
                  $taxLines[$taxHash] = [
                    'name'  => $taxName,
                    'rate'  => (float)$taxRate / 100,
                    'value' => $tax,
                  ];
                } else {
                  $taxLines[$taxHash]['value'] += $tax;
                }

                $itemTax = $tax / $quantity;
              }

              if ($taxIncluded) {
                $priceIncTax = $priceData->getUnitPrice();
                $price = $priceIncTax - $itemTax;
              } else {
                $price = $priceData->getUnitPrice();
                $priceIncTax = $price + $itemTax;
              }

              $options = [];

              if (!empty($parentId)) {
                $optionCriteria = new Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria([$id]);
                $optionCriteria->addAssociation('options.group');
                $variant = $productRepository->search($optionCriteria, $defaultContext)->first();

                if (!empty($variant)) {
                  foreach ($variant->getOptions()->getElements() as $option) {
                    $options[] = [
                      'id'       => $option->getGroupId(),
                      'name'     => $option->getGroup()->getName(),
                      'value_id' => $option->getId(),
                      'value'    => $option->getName(),
                    ];
                  }
                }
              }

              $products[] = [
                'id'            => $id,
                'name'          => $cartProduct->getLabel(),
                'quantity'      => $quantity,
                'sku'           => $cartProduct->getPayloadValue('productNumber'),
                'weight'        => $cartProduct->getDeliveryInformation()->getWeight(),
                'price'         => $price,
                'price_inc_tax' => $priceIncTax,
                'rate'          => (float)$taxRate / 100,
                'tax'           => $itemTax,
                'weight_unit'   => $weightUnit,
                'parent_id'     => $parentId,
                'options'       => $options,
              ];
              $subtotal += $priceData->getTotalPrice();
              $totalTax += $tax;
              $itemAddedToCart = true;
              break;
            }
          }
        }

        if (!$itemAddedToCart) {
          throw new Exception("Product unavailable. Product data: " . json_encode($item));
        }
      }

      $cartDelivery = $cart->getDeliveries()->first();
      $defaultShippingMethodId = null;
      $addShippingRate = function ($cartDelivery) use (&$shippingRates, $taxIncluded) {
        $shippingMethodData = $cartDelivery->getShippingMethod();
        $shippingCostData = $cartDelivery->getShippingCosts();
        $calculatedTaxes = $shippingCostData->getCalculatedTaxes();
        $tax = 0;
        $taxRate = 0;

        if (!empty($calculatedTaxes)) {
          foreach ($calculatedTaxes as $calculatedTax) {
            $taxValue = $calculatedTax->getTax();

            if ($taxValue) {
              $tax += $taxValue;
              $taxRate += $calculatedTax->getTaxRate();
            }
          }
        }

        if ($taxIncluded) {
          $priceIncTax = $shippingCostData->getTotalPrice();
          $price = $priceIncTax - $tax;
        } else {
          $price = $shippingCostData->getTotalPrice();
          $priceIncTax = $price + $tax;
        }

        $shippingRates[] = [
          'id'             => $shippingMethodData->getId(),
          'name'           => $shippingMethodData->getName(),
          'price'          => $price,
          'price_incl_tax' => $priceIncTax,
          'tax'            => $tax,
          'rate'           => (float)$taxRate / 100,
        ];
      };

      if (!empty($cartDelivery)) {
        $defaultShippingMethodId = $cartDelivery->getShippingMethod()->getId();
        $addShippingRate($cartDelivery);
      }

      // Get all possible shipping methods
      if (version_compare($this->cartVars['dbVersion'], '6.2.0.0', '<')) {
        $shippingMethodRepository = $container->get('shipping_method.repository');
        $criteria = new Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria();
        $availableShippingMethods = $shippingMethodRepository->search(
          new Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria(),
          $defaultContext
        )->getEntities()->getElements();
      } else {
        $availableShippingMethods = $shippingRoute->load(
          new Symfony\Component\HttpFoundation\Request(),
          $context,
          new Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria()
        )->getShippingMethods();
      }

      // Calculate shipping costs for all available shipping methods except the default one
      if (!empty($availableShippingMethods)) {
        foreach ($availableShippingMethods as $shippingMethod) {
          if ($shippingMethod->getId() === $defaultShippingMethodId) {
            continue;
          }

          $context = $getContext($context, $shippingMethod);
          $cart = $cartService->recalculate($cart, $context);

          $cartDelivery = $cart->getDeliveries()->first();

          if (!empty($cartDelivery)) {
            $defaultShippingMethodId = $cartDelivery->getShippingMethod()->getId();
            $addShippingRate($cartDelivery);
          }
        }
      }

      if (defined(Shopware\Core\Checkout\Cart\LineItem\LineItem::class . 'PROMOTION_LINE_ITEM_TYPE')) {
        $lineItemType = Shopware\Core\Checkout\Cart\LineItem\LineItem::PROMOTION_LINE_ITEM_TYPE;
      } else {
        $lineItemType = 'promotion';
      }

      if (!empty($a2cData['coupons'])) {
        foreach ($a2cData['coupons'] as $coupon) {
          if (version_compare($this->cartVars['dbVersion'], '6.3.0.0', '>=')) {
            $promotion = $promotionRepository->search(
              (new Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria())->addFilter(
                new \Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\MultiFilter(
                  \Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\MultiFilter::CONNECTION_OR,
                  [
                    new Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter('code', $coupon),
                    new Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter('name', $coupon)
                  ]
                )
              ),
              $defaultContext
            )->first();
          } else {
            $promotion = $promotionRepository->search(
              (new Shopware\Core\Framework\DataAbstractionLayer\Search\Criteria())->addFilter(
                new Shopware\Core\Framework\DataAbstractionLayer\Search\Filter\EqualsFilter('code', $coupon)
              ),
              $defaultContext
            )->first();
          }

          if (!empty($promotion)) {
            $couponCode = $promotion->getCode();

            if (!empty($couponCode)) {
              $lineItem = new Shopware\Core\Checkout\Cart\LineItem\LineItem(Shopware\Core\Framework\Uuid\Uuid::randomHex(), $lineItemType, $couponCode);
              $lineItem->setPayloadValue('code', $couponCode);
              $lineItem->setRemovable(true);
              $lineItem->setStackable(false);
              $cart = $cartService->add($cart, $lineItem, $context);
            }
          }
        }
      }

      $appliedPromotions = $cart->getLineItems()->filterType($lineItemType);
      $discounts = [];
      $totalDiscount = 0;

      if (!empty($appliedPromotions)) {
        foreach ($appliedPromotions as $promotion) {
          $couponCode = $promotion->getPayloadValue('code');
          $discountValue = abs($promotion->getPrice()->getTotalPrice());

          $discounts[] = [
            'code'  => empty($couponCode) ? $promotion->getLabel() : $couponCode,
            'value' => $discountValue,
          ];

          $totalDiscount += $discountValue;
        }
      }

      if (method_exists($context, 'getCurrencyId')) {
        $currencyId = $context->getCurrencyId();
      } else {
        $currencyId = $context->getCurrency()->getId();
      }

      $response['result'] = [
        'currency_id'    => $currencyId,
        'customer'       => [
          'id'             => $customer->getId(),
          'first_name'     => $customer->getFirstName(),
          'last_name'      => $customer->getLastName(),
          'email'          => $customer->getEmail(),
          'guest_customer' => $customer->getGuest(),
        ],
        'shipping_rates' => $shippingRates,
        'discounts'      => $discounts,
        'discount'       => $totalDiscount,
        'subtotal'       => $subtotal - $totalTax,
        'tax'            => $totalTax,
        'taxes'          => $taxLines,
        'products'       => $products,
      ];
    } catch (Exception $e) {
      return $reportError($e);
    }

    return $response;
  }

  /**
   * @return string
   * @throws Exception
   */
  protected function _getStoreRoot()
  {
    if (file_exists(M1_STORE_BASE_DIR . '.env.local')) {
      (new \Symfony\Component\Dotenv\Dotenv(true))->load(M1_STORE_BASE_DIR . '.env.local');
      $storeRoot = M1_STORE_BASE_DIR;
    } elseif (file_exists(M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR . '.env.local')) {
      (new \Symfony\Component\Dotenv\Dotenv(true))->load(M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR . '.env.local');
      $storeRoot = M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR;
    } elseif (file_exists(M1_STORE_BASE_DIR . '.env')) {
      (new \Symfony\Component\Dotenv\Dotenv(true))->load(M1_STORE_BASE_DIR . '.env');
      $storeRoot = M1_STORE_BASE_DIR;
    } elseif(file_exists(M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR . '.env')) {
      (new \Symfony\Component\Dotenv\Dotenv(true))->load(M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR . '.env');
      $storeRoot = M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR;
    } else {
      throw new \Exception('File \'.env\' not found');
    }

    return $storeRoot;
  }

}

/**
 * Class M1_Config_Adapter_Prestashop
 */
class M1_Config_Adapter_Prestashop extends M1_Config_Adapter
{

  const ERROR_CODE_SUCCESS = 0;
  const ERROR_CODE_INTERNAL_ERROR = 2;

  public function __construct()
  {
    if (!file_exists(M1_STORE_BASE_DIR . "app/AppKernel.php")) {
      require_once(M1_STORE_BASE_DIR . "config/settings.inc.php");
    }

    if (file_exists(M1_STORE_BASE_DIR . "config/defines.inc.php"))
      require_once(M1_STORE_BASE_DIR . "config/defines.inc.php");
    if (file_exists(M1_STORE_BASE_DIR . "config/autoload.php"))
      require_once(M1_STORE_BASE_DIR . "config/autoload.php");

    if (file_exists(M1_STORE_BASE_DIR . "config/bootstrap.php"))
      require_once(M1_STORE_BASE_DIR . "config/bootstrap.php");

    $this->setHostPort(_DB_SERVER_);
    $this->dbname = _DB_NAME_;
    $this->username = _DB_USER_;
    $this->password = _DB_PASSWD_;
    $this->tblPrefix = _DB_PREFIX_;

    if (defined('_PS_IMG_DIR_')) {
      $this->imagesDir = DIRECTORY_SEPARATOR . str_replace(M1_STORE_BASE_DIR, '', _PS_IMG_DIR_);
    } else {
      $this->imagesDir = "/img/";
    }

    if (defined('_PS_VERSION_')) {
      $this->cartVars['dbVersion'] = _PS_VERSION_;
    }

    $this->categoriesImagesDir = DIRECTORY_SEPARATOR . str_replace(M1_STORE_BASE_DIR, '', _PS_CAT_IMG_DIR_);

    if (defined('_PS_PROD_IMG_DIR_')) {
        $this->productsImagesDir = DIRECTORY_SEPARATOR . str_replace(M1_STORE_BASE_DIR, '', _PS_PROD_IMG_DIR_);
    } elseif (defined('_PS_PRODUCT_IMG_DIR_')) {
        $this->productsImagesDir = DIRECTORY_SEPARATOR . str_replace(M1_STORE_BASE_DIR, '', _PS_PRODUCT_IMG_DIR_);
    } else {
        $this->productsImagesDir = DIRECTORY_SEPARATOR . str_replace(M1_STORE_BASE_DIR, '', _PS_IMG_DIR_ . 'p' . DIRECTORY_SEPARATOR);
    }

    $this->manufacturersImagesDir = DIRECTORY_SEPARATOR . str_replace(M1_STORE_BASE_DIR, '', _PS_MANU_IMG_DIR_);
  }

  /**
   * @inheritDoc
   */
  public function sendEmailNotifications($a2cData)
  {
    require_once _PS_ROOT_DIR_ . '/config/config.inc.php';

    if (file_exists(_PS_ROOT_DIR_ . '/vendor/autoload.php')) {
      require_once _PS_ROOT_DIR_ . '/vendor/autoload.php';
    }

    if (version_compare($this->cartVars['dbVersion'], '1.7.0', '<')) {
      $moduleName = 'mailalerts';
      $className = 'MailAlerts';
    } else {
      global $kernel;
      if(!$kernel){
        require_once _PS_ROOT_DIR_.'/app/AppKernel.php';
        $kernel = new AppKernel('prod', false);
        $kernel->boot();
      }

      $className = 'Ps_EmailAlerts';
      $moduleName = 'ps_emailalerts';
    }

    $path = _PS_ROOT_DIR_ . '/modules/' . $moduleName . '/' . $moduleName . '.php';

    if (file_exists($path)) {
      require_once $path;

      $context = Context::getContext();
      $context->shop = new Shop($a2cData['store_id']);
      Shop::setContext(Shop::CONTEXT_SHOP, $a2cData['store_id']);
      Configuration::loadConfiguration();

      $module = new $className();

      foreach ($a2cData['notifications'] as $notification) {
        $order = new Order($notification['order_id']);
        $customer = new Customer((int)$order->id_customer);
        $cart = new Cart((int)$order->id_cart);
        $currency = new Currency((int)$order->id_currency);

        if (!$context->currency) {
          $context->currency = $currency;
        }

        $orderStatus = OrderHistoryCore::getLastOrderState((int)$order->id);

        $module->hookActionValidateOrder(
          array(
            'cart' => $cart,
            'customer' => $customer,
            'order' => $order,
            'currency' => $currency,
            'orderStatus' => $orderStatus,
          )
        );
      }

      return true;
    }

    return false;
  }

  /**
   * @param array $a2cData Data
   *
   * @return array|mixed
   */
  public function orderCalculate($a2cData)
  {
    $response = [
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => [],
    ];

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    $prevErrorReporting = error_reporting(error_reporting() & ~E_DEPRECATED);

    try {
      require_once _PS_ROOT_DIR_ . '/config/config.inc.php';

      if (file_exists(_PS_ROOT_DIR_ . '/vendor/autoload.php')) {
        require_once _PS_ROOT_DIR_ . '/vendor/autoload.php';
      }

      if (version_compare($this->cartVars['dbVersion'], '9.0.0', '<')) {
        global $kernel;

        if (!$kernel) {
          require_once _PS_ROOT_DIR_ . '/app/AppKernel.php';

          $kernel = new AppKernel('prod', false);
          $kernel->boot();
        }
      } elseif (version_compare($this->cartVars['dbVersion'], '9.1.0', '>=')) {
        global $kernel;

        if (class_exists('FrontKernel')) {
          $kernel = new FrontKernel('prod', false);
          $kernel->boot();
        } elseif (class_exists('AdminKernel')) {
          $kernel = new AdminKernel('prod', false);
          $kernel->boot();
        }
      }

      $context = Context::getContext();
      $customer = new Customer();

      $context->shop = new Shop($a2cData['store_id']);
      Shop::setContext(Shop::CONTEXT_SHOP, $a2cData['store_id']);
      Configuration::loadConfiguration();

      $cart = new Cart();

      $cart->id_shop = (int)$context->shop->id;
      $cart->id_lang = (int)$context->language->id;
      $cart->id_currency = (int)$a2cData['currency_id'];
      $cart->id_shop_group = (int)$context->shop->id_shop_group;

      $context->currency = new Currency($cart->id_currency);

      $customerData = $customer->getByEmail($a2cData['email'], null, false);

      //For calculations, it is mandatory to save the user in the database.
      if (!$customerData) {
        //A record in the table will only be created if there is no guest customer with the same email address in the table.
        $customerData = new Customer();

        $customerData->firstname = $a2cData['shipping']['firstname'];
        $customerData->lastname = $a2cData['shipping']['lastname'];
        $customerData->email = $a2cData['email'];
        $customerData->is_guest = 1;
        $customerData->passwd = Tools::hash(Tools::passwdGen());

        $customerData->add();
      }

      $shippingAddress = new Address();
      $billingAddress = new Address();

      $setAddress = function($rowData, &$addressObject) use ($customerData) {
        foreach ($rowData as $property => $value) {
          if ($property === 'country') {
            $addressObject->id_country = Country::getByIso($value);
          } elseif ($property === 'state') {
            $stateId = State::getIdByIso($value);

            if (empty($stateId)) {
              $stateId = State::getIdByName($value);
            }

            $addressObject->id_state = (int)$stateId;
          } else {
            $addressObject->{$property} = $value;
          }
        }

        $addressObject->id_customer = $customerData->id;

        //For tax and delivery calculations, it is mandatory to save the address in the database.
        $addressObject->add();
      };

      $setAddress($a2cData['shipping'], $shippingAddress);
      $setAddress($a2cData['billing'], $billingAddress);

      $cart->id_customer = (int)$customerData->id;
      $cart->id_address_delivery = (int)$shippingAddress->id;
      $cart->id_address_invoice = (int)$billingAddress->id;
      $cart->secure_key = md5(uniqid());

      //The cart must be saved in the database for further calculations.
      try {
        @$cart->add();
      } catch (Exception $e) {
        if (_PS_MODE_DEV_) {
          while (ob_get_level() > 0) {
            ob_end_clean();
          }

          throw new Exception("The order cannot be calculated because Debug Mode is currently enabled on the store.");
        } else {
          throw $e;
        }
      }

      $context->customer = $customerData;
      $context->cart = $cart;

      foreach ($a2cData['items'] as $item) {
        if (!$cart->updateQty(
            (int)$item['quantity'],
            (int)$item['product_id'],
            (isset($item['product_attribute_id']) ? (int)$item['product_attribute_id'] : null)
          )
        ) {
          throw new Exception("Product unavailable. Product data: " . json_encode($item));
        }
      }

      if (!empty($a2cData['coupons'])) {
        foreach ($a2cData['coupons'] as $coupon) {
          $cartRule = new CartRule(CartRule::getIdByCode($coupon));

          if (Validate::isLoadedObject($cartRule)) {
            $cart->addCartRule($cartRule->id);
          }
        }
      }

      $cart->update();
      $summary = $cart->getSummaryDetails();
      $deliveryOptions = $cart->getDeliveryOptionList();

      $products = [];
      $shippingRates = [];
      $taxLines = [];
      $discounts = [];

      if (!empty($summary['discounts'])) {
        foreach ($summary['discounts'] as $discount) {
          $valueIncTax = (float)$discount['value_real'];

          $discounts[] = [
            'code'          => $discount['code'],
            'value'         => $valueIncTax,
            'free_shipping' => (int)$discount['free_shipping'],
            'tax_discount'  => $valueIncTax - (float)$discount['value_tax_exc'],
          ];
        }
      }

      foreach ($cart->getProducts(true) as $product) {
        $price = (float)$product['price'];
        $priceIncTax = (float)$product['price_wt'];
        $tax = $priceIncTax - $price;
        $qty = (int)$product['cart_quantity'];
        $itemTotalTax = $tax * $qty;

        $productData = [
          'id'                     => $product['id_product'],
          'variant_id'             => $product['id_product_attribute'],
          'quantity'               => $qty,
          'sku'                    => $product['reference'],
          'name'                   => $product['name'],
          'price'                  => $price,
          'price_inc_tax'          => $priceIncTax,
          'weight'                 => $product['weight'],
          'ean13'                  => $product['ean13'],
          'isbn'                   => $product['isbn'],
          'upc'                    => $product['upc'],
          'tax'                    => $tax,
          'combination_attributes' => [],
        ];

        if ((int)$product['id_product_attribute'] !== 0) {
          $combination = new Combination($product['id_product_attribute']);
          $combinationAttributes = $combination->getAttributesName((int)$context->language->id);

          if (!empty($combinationAttributes)) {
            $productAttributes = Product::getAttributesInformationsByProduct((int)$product['id_product']);

            if (!empty($productAttributes) && is_array($productAttributes)) {
              $productAttributes = array_column($productAttributes, null, 'id_attribute');

              foreach ($combinationAttributes as $combinationAttribute) {
                $productData['combination_attributes'][] = [
                  'attribute_value_id' => $combinationAttribute['id_attribute'],
                  'attribute_value'    => $combinationAttribute['name'],
                  'attribute_id'       => $productAttributes[$combinationAttribute['id_attribute']]['id_attribute_group'],
                  'attribute'          => $productAttributes[$combinationAttribute['id_attribute']]['group'],
                ];
              }
            }
          }
        }

        try {
          $productObj = new Product($product['id_product']);
          $taxManager = TaxManagerFactory::getManager($shippingAddress, $productObj->id_tax_rules_group);
          $taxCalculator = $taxManager->getTaxCalculator();
          $taxes = $taxCalculator->taxes;

          if (!empty($taxes)) {
            foreach ($taxes as $taxLine) {
              if (is_array($taxLine->name)) {
                if (empty($taxLine->name[$cart->id_lang])) {
                  $taxName = reset($taxLine->name);
                } else {
                  $taxName = $taxLine->name[$cart->id_lang];
                }
              } else {
                $taxName = $taxLine->name;
              }

              $taxHash = md5($taxName);

              if (empty($taxLines[$taxHash])) {
                $taxLines[$taxHash] = [
                  'name'  => $taxName,
                  'rate'  => (float)$taxLine->rate / 100,
                  'value' => $itemTotalTax,
                ];
              } else {
                $taxLines[$taxHash]['value'] += $itemTotalTax;
              }
            }
          }
        } catch (Exception $e) {}

        $products[] = $productData;
      }

      if (!empty($deliveryOptions)) {
        foreach ($deliveryOptions as $addressDelivery) {
          if (!empty($addressDelivery)) {
            foreach ($addressDelivery as $delivery) {
              if (!empty($delivery['carrier_list'])) {
                foreach ($delivery['carrier_list'] as $carrier) {
                  $shippingRates[] = [
                    'id_carrier'    => $carrier['instance']->id,
                    'name'          => $carrier['instance']->name,
                    'price_inc_tax' => $carrier['price_with_tax'],
                    'price'         => $carrier['price_without_tax'],
                  ];
                }
              }
            }
          }
        }
      }

      $response['result'] = [
        'products'       => $products,
        'shipping_rates' => $shippingRates,
        'currency_id'    => $cart->id_currency,
        'customer'       => [
          'id'             => $customerData->id,
          'first_name'     => $customerData->firstname,
          'last_name'      => $customerData->lastname,
          'email'          => $customerData->email,
          'guest_customer' => (int)$customerData->is_guest,
        ],
        'weight_unit'    => Configuration::get('PS_WEIGHT_UNIT'),
        'taxes'          => $taxLines,
        'subtotal'       => $summary['total_products'],
        'tax'            => (float)$summary['total_tax'] - ((float)$summary['total_shipping'] - (float)$summary['total_shipping_tax_exc']),
        'discount'       => $summary['total_discounts_tax_exc'],
        'discounts'      => $discounts,
      ];
    } catch (Exception $e) {
      return $reportError($e);
    } finally {
      error_reporting($prevErrorReporting);

      // Delete all cart and addresses data from the database after calculations
      if (Validate::isLoadedObject(isset($cart) ? $cart : null)) {
        $cart->delete();
      }

      if (Validate::isLoadedObject(isset($shippingAddress) ? $shippingAddress : null)) {
        $shippingAddress->delete();
      }

      if (Validate::isLoadedObject(isset($billingAddress) ? $billingAddress : null)) {
        $billingAddress->delete();
      }
    }

    return $response;
  }

}

/**
 * Class M1_Config_Adapter_Pinnacle361
 */
class M1_Config_Adapter_Pinnacle361 extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_Pinnacle361 constructor.
   */
  public function __construct()
  {
    include_once M1_STORE_BASE_DIR . 'content/engine/engine_config.php';

    $this->imagesDir = 'images/';
    $this->categoriesImagesDir    = $this->imagesDir;
    $this->productsImagesDir      = $this->imagesDir;
    $this->manufacturersImagesDir = $this->imagesDir;

    //$this->Host = DB_HOST;
    $this->setHostPort(DB_HOST);
    $this->dbname = DB_NAME;
    $this->username = DB_USER;
    $this->password = DB_PASSWORD;
    $this->tblPrefix = defined('DB_PREFIX') ? DB_PREFIX : '';

    $version = $this->getCartVersionFromDb(
      "value",
      "settings",
      "name = 'AppVer'"
    );
    if ($version != '') {
      $this->cartVars['dbVersion'] = $version;
    }
  }

}


/**
 * Class M1_Config_Adapter_Oxid
 */
class M1_Config_Adapter_Oxid extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_Oxid constructor.
   */
  public function __construct()
  {
    //@include_once M1_STORE_BASE_DIR . "config.inc.php";
    $config = file_get_contents(M1_STORE_BASE_DIR . "config.inc.php");
    try {
      preg_match("/dbName(.+)?=(.+)?\'(.+)\';/", $config, $match);
      $this->dbname   = $match[3];
      preg_match("/dbUser(.+)?=(.+)?\'(.+)\';/", $config, $match);
      $this->username = $match[3];
      preg_match("/dbPwd(.+)?=(.+)?\'(.+)\';/", $config, $match);
      $this->password = isset($match[3]) ? $match[3] : '';
      preg_match("/dbHost(.+)?=(.+)?\'(.*)\';/", $config, $match);
      $this->setHostPort($match[3]);
    } catch (Exception $e) {
      die('ERROR_READING_STORE_CONFIG_FILE');
    }

    preg_match('/date_default_timezone_set\s*\(\s*[\'"](.*)[\'"]\s*\)/', $config, $timezone);
    if (isset($timezone[1])) {
      $this->cartVars['timezone'] = $timezone[1];
    }

    //check about last slash
    $this->imagesDir = "out/pictures/";
    $this->categoriesImagesDir    = $this->imagesDir;
    $this->productsImagesDir      = $this->imagesDir;
    $this->manufacturersImagesDir = $this->imagesDir;

    $keyConfVal = '';

    if (is_file(M1_STORE_BASE_DIR . '/core/oxconfk.php')) {
      $keyConfigFile = file_get_contents(M1_STORE_BASE_DIR . '/core/oxconfk.php');
      preg_match("/sConfigKey(.+)?=(.+)?\"(.+)?\";/", $keyConfigFile, $match);
      $keyConfVal = isset($match[3]) ? $match[3] : '';
    } else {
      $configPhpPath = M1_STORE_BASE_DIR . '..' . '/vendor/oxid-esales/oxideshop-ce/source/Core/Config.php';

      if (is_file($configPhpPath)) {
        $keyConfigFile = file_get_contents($configPhpPath);
        preg_match('/DEFAULT_CONFIG_KEY\s*=\s*[\'"](.+?)[\'"]\s*/', $keyConfigFile, $match);
        $keyConfVal = isset($match[1]) ? $match[1] : '';
      }
    }

    $this->cartVars['sConfigKey'] = $keyConfVal;

    $shopVersionPath = M1_STORE_BASE_DIR . '..' . '/vendor/oxid-esales/oxideshop-ce/source/Core/ShopVersion.php';

    if (is_file($shopVersionPath)) {
      $shopVersionFile = file_get_contents($shopVersionPath);
      preg_match("/return\s*['\"](\d+\.\d+\.\d+)['\"]/", $shopVersionFile, $versionMatch);

      if (!empty($versionMatch[1])) {
        $this->cartVars['dbVersion'] = $versionMatch[1];
      }
    }

    if (empty($this->cartVars['dbVersion'])) {
      $version = $this->getCartVersionFromDb("OXVERSION", "oxshops", "OXACTIVE=1 LIMIT 1");

      if ($version != '') {
        $this->cartVars['dbVersion'] = $version;
      }
    }
  }

}



/**
 * Class M1_Config_Adapter_Oscommerce3
 */
class M1_Config_Adapter_Oscommerce3 extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_Oscommerce3 constructor.
   */
  public function __construct()
  {
    $file = M1_STORE_BASE_DIR .'/osCommerce/OM/Config/settings.ini';
    $settings = parse_ini_file($file);
    $this->imagesDir = "/public/";
    $this->categoriesImagesDir    = $this->imagesDir."/categories";
    $this->productsImagesDir      = $this->imagesDir."/products";
    $this->manufacturersImagesDir = $this->imagesDir;

    $this->host      = $settings['db_server'];
    $this->setHostPort($settings['db_server_port']);
    $this->username  = $settings['db_server_username'];
    $this->password  = $settings['db_server_password'];
    $this->dbname    = $settings['db_database'];

    if (isset($settings['db_table_prefix']))
      $this->tblPrefix = $settings['db_table_prefix'];
  }

}



/**
 * Class M1_Config_Adapter_Oscommerce22ms2
 */
class M1_Config_Adapter_Oscommerce22ms2 extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_Oscommerce22ms2 constructor.
   */
  public function __construct()
  {
    $curDir = getcwd();

    chdir(M1_STORE_BASE_DIR);

    @require_once M1_STORE_BASE_DIR
                . "includes" . DIRECTORY_SEPARATOR
                . "configure.php";

    chdir($curDir);

    $this->imagesDir = DIR_WS_IMAGES;

    $this->categoriesImagesDir    = $this->imagesDir;
    $this->productsImagesDir      = $this->imagesDir;
    if (defined('DIR_WS_PRODUCT_IMAGES') ) {
      $this->productsImagesDir = DIR_WS_PRODUCT_IMAGES;
    }
    if (defined('CFG_TIME_ZONE') ) {
      $this->cartVars['timeZone'] = CFG_TIME_ZONE;
    }
    if (defined('DIR_WS_ORIGINAL_IMAGES')) {
      $this->productsImagesDir = DIR_WS_ORIGINAL_IMAGES;
    }
    $this->manufacturersImagesDir = $this->imagesDir;

    //$this->Host      = DB_SERVER;
    $this->setHostPort(DB_SERVER);
    $this->username  = DB_SERVER_USERNAME;
    $this->password  = DB_SERVER_PASSWORD;
    $this->dbname    = DB_DATABASE;

    if (defined('DB_TABLE_PREFIX'))
      $this->tblPrefix = DB_TABLE_PREFIX;

    chdir(M1_STORE_BASE_DIR);
    if (file_exists(M1_STORE_BASE_DIR  . "includes" . DIRECTORY_SEPARATOR . 'application_top.php')) {
      $conf = file_get_contents (M1_STORE_BASE_DIR . "includes" . DIRECTORY_SEPARATOR . "application_top.php");
      preg_match("/define\('PROJECT_VERSION.*/", $conf, $match);
      if (isset($match[0]) && !empty($match[0])) {
        preg_match("/\d.*/", $match[0], $project);
        if (isset($project[0]) && !empty($project[0])) {
          $version = $project[0];
          $version = str_replace(array(" ","-","_","'",");"), "", $version);
          if ($version != '') {
            $this->cartVars['dbVersion'] = strtolower($version);
          }
        }
      } else {
        //if another oscommerce based cart
        if (file_exists(M1_STORE_BASE_DIR  . "includes" . DIRECTORY_SEPARATOR . 'version.php')) {
          @require_once M1_STORE_BASE_DIR . "includes" . DIRECTORY_SEPARATOR . "version.php";
          if (defined('PROJECT_VERSION') && PROJECT_VERSION != '' ) {
            $version = PROJECT_VERSION;
            preg_match("/\d.*/", $version, $vers);
            if (isset($vers[0]) && !empty($vers[0])) {
              $version = $vers[0];
              $version = str_replace(array(" ","-","_"), "", $version);
              if ($version != '') {
                $this->cartVars['dbVersion'] = strtolower($version);
              }
            }
            //if zen_cart
          } else {
            if (defined('PROJECT_VERSION_MAJOR') && PROJECT_VERSION_MAJOR != '' ) {
              $this->cartVars['dbVersion'] = PROJECT_VERSION_MAJOR;
            }
            if (defined('PROJECT_VERSION_MINOR') && PROJECT_VERSION_MINOR != '' ) {
              $this->cartVars['dbVersion'] .= '.' . PROJECT_VERSION_MINOR;
            }
          }
        }
      }
    }
    chdir($curDir);
  }

}



/**
 * Class M1_Config_Adapter_Opencart14
 */
class M1_Config_Adapter_Opencart14 extends M1_Config_Adapter
{

  const ERROR_CODE_SUCCESS = 0;
  const ERROR_CODE_INTERNAL_ERROR = 1;
  const A2C_PLUGIN_LIVE_SHIPPING_RATES_SLUG_OC4 = 'api2cart_live_shipping_rates_oc4';
  const A2C_LIVE_SHIPPING_RATES = 'a2c_live_shipping_rates';

  /**
   * M1_Config_Adapter_Opencart14 constructor.
   */
  public function __construct()
  {
    include_once (M1_STORE_BASE_DIR . "/config.php");

    if (defined('DB_HOST')) {
      $this->setHostPort(DB_HOST);
    } else {
      $this->setHostPort(DB_HOSTNAME);
    }

    if (defined('DB_USER')) {
      $this->username = DB_USER;
    } else {
      $this->username = DB_USERNAME;
    }

    if (defined('DB_PORT')) {
      $this->port = DB_PORT;
    }

    $this->password = DB_PASSWORD;

    if (defined('DB_NAME')) {
      $this->dbname = DB_NAME;
    } else {
      $this->dbname = DB_DATABASE;
    }

    if (defined('DB_PREFIX')) {
      $this->tblPrefix = DB_PREFIX;
    }

    $indexFileContent = '';
    $startupFileContent = '';

    if (file_exists(M1_STORE_BASE_DIR . "/index.php")) {
      $indexFileContent = file_get_contents(M1_STORE_BASE_DIR . "/index.php");
    }

    if (file_exists(M1_STORE_BASE_DIR . "/system/startup.php")) {
      $startupFileContent = file_get_contents(M1_STORE_BASE_DIR . "/system/startup.php");
    }

    if (preg_match("/define\('\VERSION\'\, \'(.+)\'\)/", $indexFileContent, $match) == 0 ) {
      preg_match("/define\('\VERSION\'\, \'(.+)\'\)/", $startupFileContent, $match);
    }

    if (count($match) > 0) {
      $this->cartVars['dbVersion'] = $match[1];
      unset($match);
    }

    $this->imagesDir              = "/image/";
    $this->categoriesImagesDir    = $this->imagesDir;
    $this->productsImagesDir      = $this->imagesDir;
    $this->manufacturersImagesDir = $this->imagesDir;

  }

  /**
   * @param array $a2cData Data
   *
   * @return array|mixed
   */
  public function sendEmailNotifications($a2cData)
  {
    foreach ($a2cData as $notification) {
      $this->_sendNewOrderEmailNotifications(
        $notification['storeId'],
        $notification['orderId'],
        $notification['notifyCustomer'],
        $notification['commentFromAdmin'],
        $notification['notifyAdmin']
      );
    }

    return ['result' => true];
  }

  /**
   * @param array $a2cData Data
   *
   * @return array|mixed
   */
  public function cleanCache($a2cData)
  {
    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => array(),
    );

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      require_once(DIR_SYSTEM . 'startup.php');

      if (version_compare($this->cartVars['dbVersion'], '4', '>=')) {
        $autoloader = new \Opencart\System\Engine\Autoloader();
        $autoloader->register('Opencart\Extension', DIR_EXTENSION);
        $autoloader->register('Opencart\System', DIR_SYSTEM);

        $cache = new \Opencart\System\Library\Cache('File');
      } else {
        $registry = new Registry();
        $loader = new Loader($registry);
        $registry->set('load', $loader);

        $cache = new Cache\File();
      }

      $cache->delete($a2cData['value']);

      return ['result' => true];
    } catch (Exception $e) {
      return $reportError($e);
    } catch (Throwable $e) {
      return $reportError($e);
    }

    return $response;
  }

  /**
   * @param int    $store_id         StoreId
   * @param int    $order_id         OrderId
   * @param bool   $notifyCustomer   Whether customer must be notified
   * @param string $commentFromAdmin Admin message to the customer
   * @param bool   $notifyAdmin      Whether admin must be notified
   */
  private function _sendNewOrderEmailNotifications($store_id, $order_id, $notifyCustomer, $commentFromAdmin, $notifyAdmin)
  {
    require_once(DIR_SYSTEM . 'startup.php');

    if (version_compare($this->cartVars['dbVersion'], '4', '>=')) {
      $this->_sendNewOrderEmailNotificationsV4($order_id, $commentFromAdmin);
      return;
    }

    $registry = new Registry();

    $loader = new Loader($registry);
    $registry->set('load', $loader);

    $db = new DB(DB_DRIVER, DB_HOSTNAME, DB_USERNAME, DB_PASSWORD, DB_DATABASE);
    $registry->set('db', $db);

    $request = new Request();
    $registry->set('request', $request);

    if (version_compare($this->cartVars['dbVersion'], '2.2', '>=')) {
      // Event
      $event = new Event($registry);
      $registry->set('event', $event);
    }

    $store_query = $db->query("SELECT * FROM " . DB_PREFIX . "store WHERE store_id = " . $store_id);

    $config = new Config();
    if (version_compare($this->cartVars['dbVersion'], '2.2', '>=')) {
      $config->load('default');
    }

    if ($store_query->num_rows) {
      $config->set('config_store_id', $store_query->row['store_id']);
    } else {
      $config->set('config_url', HTTP_SERVER);
      $config->set('config_ssl', HTTPS_SERVER);
      $config->set('config_store_id', 0);
    }

    // Settings
    $query = $db->query("SELECT * FROM " . DB_PREFIX . "setting WHERE store_id = '0' OR store_id = '" . $store_id . "' ORDER BY store_id ASC");

    if (version_compare($this->cartVars['dbVersion'], '2', '<')) {
      $unserialize = function ($data) {
        return unserialize($data);
      };
    } else {
      $unserialize = function ($data) {
        return json_decode($data);
      };
    }

    foreach ($query->rows as $setting) {
      if (!$setting['serialized']) {
        $config->set($setting['key'], $setting['value']);
      } else {
        $config->set($setting['key'], $unserialize($setting['value']));
      }
    }

    if (version_compare($this->cartVars['dbVersion'], '3', '>=')) {
      $session = new Session($config->get('session_engine'), $registry);
    } else {
      $session = new Session();
    }

    $registry->set('session', $session);

    $url = new Url($config->get('config_url'), $config->get('config_secure') ? $config->get('config_ssl') : $config->get('config_url'));
    $registry->set('url', $url);

    $loader->model('checkout/order');

    /**
     * @var ModelCheckoutOrder $checkout
     */
    $checkout = $registry->get('model_checkout_order');
    $order_info = $checkout->getOrder($order_id);
    $config->set('config_currency', $order_info['currency_code']);
    $registry->set('config', $config);

    if (version_compare($this->cartVars['dbVersion'], '2.2', '>=')) {
      $langKey = 'language_code';
    } else {
      $langKey = 'language_directory';
    }

    $language = new Language($order_info[$langKey]);
    $language->load($order_info[$langKey]);

    if (version_compare($this->cartVars['dbVersion'], '2', '<')) {
      $language->load($order_info['language_filename']);
      $loader->library('currency');
      $loader->library('mail');
    }

    if (version_compare($this->cartVars['dbVersion'], '3', '<')) {
      $language->load('mail/order');
      $langTextPrefix = 'text_new_';
    } else {
      $langTextPrefix = 'text_';
      $language->load('mail/order_add');
      $language->load('mail/order_alert');
    }

    $registry->set('language', $language);

    if (version_compare($this->cartVars['dbVersion'], '2.2', '>=')) {
      /**
       * @var \Cart\Currency
       */
      $currency = new \Cart\Currency($registry);
    } else {
      $currency = new Currency($registry);
    }

    $order_status_id = (int)$order_info['order_status_id'];

    $download_status = false;
    if (version_compare($this->cartVars['dbVersion'], '2', '<')) {
      $order_product_query = $db->query("SELECT * FROM " . DB_PREFIX . "order_product WHERE order_id = '" . (int)$order_id . "'");
      $order_download_query = $db->query("SELECT * FROM " . DB_PREFIX . "order_download WHERE order_id = '" . (int)$order_id . "'");
      $download_status = (bool)$order_download_query->num_rows;
    } else {
      $order_product_query = $db->query("SELECT * FROM " . DB_PREFIX . "order_product WHERE order_id = '" . (int)$order_id . "'");
      foreach ($order_product_query->rows as $order_product) {
        // Check if there are any linked downloads
        $product_download_query = $db->query("SELECT COUNT(*) AS total FROM `" . DB_PREFIX . "product_to_download` WHERE product_id = '" . (int)$order_product['product_id'] . "'");

        if ($product_download_query->row['total']) {
          $download_status = true;
        }
      }
    }

    $order_total_query = $db->query("SELECT * FROM `" . DB_PREFIX . "order_total` WHERE order_id = '" . (int)$order_id . "' ORDER BY sort_order ASC");
    $order_voucher_query = $db->query("SELECT * FROM " . DB_PREFIX . "order_voucher WHERE order_id = '" . (int)$order_id . "'");

    // Send out order confirmation mail
    $order_status_query = $db->query(
      "SELECT * FROM " . DB_PREFIX . "order_status WHERE order_status_id = '" . (int)$order_status_id . "' AND language_id = '" . (int)$order_info['language_id'] . "'"
    );

    if ($order_status_query->num_rows) {
      $order_status = $order_status_query->row['name'];
    } else {
      $order_status = '';
    }

    if (version_compare($this->cartVars['dbVersion'], '2', '<')) {
      $storeName = html_entity_decode($order_info['store_name'], ENT_QUOTES, 'UTF-8');
      $configPrefix = '';
      $propertyPrefix = '';
    } else {
      $storeName = $order_info['store_name'];
      $configPrefix = 'mail_';
      $propertyPrefix = 'smtp_';
    }

    if (!$storeName) {
      $storeName = $config->get('config_name');
    }

    $themeDefaultDir = $config->get('theme_default_directory') ?: 'default';

    if ($notifyCustomer || $notifyAdmin) {
      $subject = sprintf($language->get($langTextPrefix . 'subject'), $storeName, $order_id);

      // HTML Mail
      $data = array();
      $data['title'] = sprintf($language->get($langTextPrefix . 'subject'), $storeName, $order_id);
      $data['text_greeting'] = sprintf($language->get($langTextPrefix . 'greeting'), $storeName);
      $data['text_link'] = $language->get($langTextPrefix . 'link');
      $data['text_download'] = $language->get($langTextPrefix . 'download');
      $data['text_order_detail'] = $language->get($langTextPrefix . 'order_detail');
      $data['text_instruction'] = $language->get($langTextPrefix . 'instruction');
      $data['text_order_id'] = $language->get($langTextPrefix . 'order_id');
      $data['text_date_added'] = $language->get($langTextPrefix . 'date_added');
      $data['text_payment_method'] = $language->get($langTextPrefix . 'payment_method');
      $data['text_shipping_method'] = $language->get($langTextPrefix . 'shipping_method');
      $data['text_email'] = $language->get($langTextPrefix . 'email');
      $data['text_telephone'] = $language->get($langTextPrefix . 'telephone');
      $data['text_ip'] = $language->get($langTextPrefix . 'ip');
      $data['text_payment_address'] = $language->get($langTextPrefix . 'payment_address');
      $data['text_shipping_address'] = $language->get($langTextPrefix . 'shipping_address');
      $data['text_product'] = $language->get($langTextPrefix . 'product');
      $data['text_model'] = $language->get($langTextPrefix . 'model');
      $data['text_quantity'] = $language->get($langTextPrefix . 'quantity');
      $data['text_price'] = $language->get($langTextPrefix . 'price');
      $data['text_total'] = $language->get($langTextPrefix . 'total');
      $data['text_footer'] = $language->get($langTextPrefix . 'footer');

      if (version_compare($this->cartVars['dbVersion'], '2', '<')) {
        $data['text_powered'] = $language->get($langTextPrefix . 'powered');
      }

      $data['logo'] = $config->get('config_url') . 'image/' . $config->get('config_logo');
      $data['store_name'] = $order_info['store_name'];
      $data['store_url'] = $order_info['store_url'];
      $data['customer_id'] = $order_info['customer_id'];
      $data['link'] = $order_info['store_url'] . 'index.php?route=account/order/info&order_id=' . $order_id;

      if ($download_status) {
        $data['download'] = $order_info['store_url'] . 'index.php?route=account/download';
      } else {
        $data['download'] = '';
      }

      $data['order_id'] = $order_id;
      $data['date_added'] = date($language->get('date_format_short'), strtotime($order_info['date_added']));
      $data['payment_method'] = $order_info['payment_method'];
      $data['shipping_method'] = $order_info['shipping_method'];
      $data['email'] = $order_info['email'];
      $data['telephone'] = $order_info['telephone'];
      $data['ip'] = $order_info['ip'];

      if (version_compare($this->cartVars['dbVersion'], '2', '>=')) {
        $data['text_order_status'] = $language->get($langTextPrefix . 'order_status');
        $data['order_status'] = $order_status;
      }

      if ($commentFromAdmin) {
        $data['comment'] = nl2br($commentFromAdmin);
      } else {
        $data['comment'] = '';
      }

      if ($order_info['payment_address_format']) {
        $format = $order_info['payment_address_format'];
      } else {
        $format = '{firstname} {lastname}' . "\n" . '{company}' . "\n" . '{address_1}' . "\n" . '{address_2}' . "\n" . '{city} {postcode}' . "\n" . '{zone}' . "\n" . '{country}';
      }

      $find = array(
        '{firstname}',
        '{lastname}',
        '{company}',
        '{address_1}',
        '{address_2}',
        '{city}',
        '{postcode}',
        '{zone}',
        '{zone_code}',
        '{country}'
      );

      $replace = array(
        'firstname' => $order_info['payment_firstname'],
        'lastname'  => $order_info['payment_lastname'],
        'company'   => $order_info['payment_company'],
        'address_1' => $order_info['payment_address_1'],
        'address_2' => $order_info['payment_address_2'],
        'city'      => $order_info['payment_city'],
        'postcode'  => $order_info['payment_postcode'],
        'zone'      => $order_info['payment_zone'],
        'zone_code' => $order_info['payment_zone_code'],
        'country'   => $order_info['payment_country']
      );

      $data['payment_address'] = str_replace(array("\r\n", "\r", "\n"), '<br />', preg_replace(array("/\s\s+/", "/\r\r+/", "/\n\n+/"), '<br />', trim(str_replace($find, $replace, $format))));

      if ($order_info['shipping_address_format']) {
        $format = $order_info['shipping_address_format'];
      } else {
        $format = '{firstname} {lastname}' . "\n" . '{company}' . "\n" . '{address_1}' . "\n" . '{address_2}' . "\n" . '{city} {postcode}' . "\n" . '{zone}' . "\n" . '{country}';
      }

      $find = array(
        '{firstname}',
        '{lastname}',
        '{company}',
        '{address_1}',
        '{address_2}',
        '{city}',
        '{postcode}',
        '{zone}',
        '{zone_code}',
        '{country}'
      );

      $replace = array(
        'firstname' => $order_info['shipping_firstname'],
        'lastname'  => $order_info['shipping_lastname'],
        'company'   => $order_info['shipping_company'],
        'address_1' => $order_info['shipping_address_1'],
        'address_2' => $order_info['shipping_address_2'],
        'city'      => $order_info['shipping_city'],
        'postcode'  => $order_info['shipping_postcode'],
        'zone'      => $order_info['shipping_zone'],
        'zone_code' => $order_info['shipping_zone_code'],
        'country'   => $order_info['shipping_country']
      );

      $data['shipping_address'] = str_replace(
        array("\r\n", "\r", "\n"), '<br />', preg_replace(array("/\s\s+/", "/\r\r+/", "/\n\n+/"), '<br />', trim(str_replace($find, $replace, $format)))
      );

      if (version_compare($this->cartVars['dbVersion'], '2', '<')) {
        $getValue = function($option) {
          return utf8_substr($option['value'], 0, utf8_strrpos($option['value'], '.'));
        };
      } else {
        $loader->model('tool/upload');
        $getValue = function($option) use ($registry) {
          /**
           * @var ModelToolUpload $modelToolUpload
           */
          $modelToolUpload = $registry->get('model_tool_upload');
          $upload_info = $modelToolUpload->getUploadByCode($option['value']);

          if ($upload_info) {
            return $upload_info['name'];
          } else {
            return '';
          }
        };
      }

      // Products
      $data['products'] = array();

      foreach ($order_product_query->rows as $product) {
        $option_data = array();

        $order_option_query = $db->query("SELECT * FROM " . DB_PREFIX . "order_option WHERE order_id = '" . (int)$order_id . "' AND order_product_id = '" . (int)$product['order_product_id'] . "'");

        foreach ($order_option_query->rows as $option) {
          if ($option['type'] != 'file') {
            $value = $option['value'];
          } else {
            $value = $getValue($option);
          }

          $option_data[] = array(
            'name'  => $option['name'],
            'value' => (utf8_strlen($value) > 20 ? utf8_substr($value, 0, 20) . '..' : $value)
          );
        }

        $data['products'][] = array(
          'name'     => $product['name'],
          'model'    => $product['model'],
          'option'   => $option_data,
          'quantity' => $product['quantity'],
          'price'    => $currency->format($product['price'] + ($config->get('config_tax') ? $product['tax'] : 0), $order_info['currency_code'], $order_info['currency_value']),
          'total'    => $currency->format($product['total'] + ($config->get('config_tax') ? ($product['tax'] * $product['quantity']) : 0), $order_info['currency_code'], $order_info['currency_value'])
        );
      }

      // Vouchers
      $data['vouchers'] = array();

      foreach ($order_voucher_query->rows as $voucher) {
        $data['vouchers'][] = array(
          'description' => $voucher['description'],
          'amount'      => $currency->format($voucher['amount'], $order_info['currency_code'], $order_info['currency_value']),
        );
      }

      // Order Totals
      foreach ($order_total_query->rows as $total) {
        $data['totals'][] = array(
          'title' => $total['title'],
          'text'  => $currency->format($total['value'], $order_info['currency_code'], $order_info['currency_value']),
        );
      }

      if (version_compare($this->cartVars['dbVersion'], '2', '<')) {
        $template = new Template();
        $template->data = $data;
        if (file_exists(DIR_TEMPLATE . $config->get('config_template') . '/template/mail/order.tpl')) {
          $html = $template->fetch($config->get('config_template') . '/template/mail/order.tpl');
        } else {
          $html = $template->fetch($themeDefaultDir . '/template/mail/order.tpl');
        }
      } elseif (version_compare($this->cartVars['dbVersion'], '2.2', '<')) {
        if (file_exists(DIR_TEMPLATE . $config->get('config_template') . '/template/mail/order.tpl')) {
          $html = $loader->view($config->get('config_template') . '/template/mail/order.tpl', $data);
        } else {
          $html = $loader->view($themeDefaultDir . '/template/mail/order.tpl', $data);
        }
      } elseif (version_compare($this->cartVars['dbVersion'], '3', '<')) {
        $html = $loader->view($themeDefaultDir . '/template/mail/order', $data);
      } else {
        $html = $loader->view($themeDefaultDir . '/template/mail/order_add', $data);
      }

      // Text Mail
      $text = sprintf($language->get($langTextPrefix . 'greeting'), html_entity_decode($order_info['store_name'], ENT_QUOTES, 'UTF-8')) . "\n\n";
      $text .= $language->get($langTextPrefix . 'order_id') . ' ' . $order_id . "\n";
      $text .= $language->get($langTextPrefix . 'date_added') . ' ' . date($language->get('date_format_short'), strtotime($order_info['date_added'])) . "\n";
      $text .= $language->get($langTextPrefix . 'order_status') . ' ' . $order_status . "\n\n";

      if ($commentFromAdmin) {
        $text .= $language->get($langTextPrefix . 'instruction') . "\n\n";
        $text .= $commentFromAdmin . "\n\n";
      }

      // Products
      $text .= $language->get($langTextPrefix . 'products') . "\n";

      foreach ($order_product_query->rows as $product) {
        $text .= $product['quantity'] . 'x ' . $product['name'] . ' (' . $product['model'] . ') ' . html_entity_decode($currency->format($product['total'] + ($config->get('config_tax') ? ($product['tax'] * $product['quantity']) : 0), $order_info['currency_code'], $order_info['currency_value']), ENT_NOQUOTES, 'UTF-8') . "\n";

        $order_option_query = $db->query("SELECT * FROM " . DB_PREFIX . "order_option WHERE order_id = '" . (int)$order_id . "' AND order_product_id = '" . $product['order_product_id'] . "'");

        foreach ($order_option_query->rows as $option) {
          if ($option['type'] != 'file') {
            $value = $option['value'];
          } else {
            $value = $getValue($option);
          }

          $text .= chr(9) . '-' . $option['name'] . ' ' . (utf8_strlen($value) > 20 ? utf8_substr($value, 0, 20) . '..' : $value) . "\n";
        }
      }

      foreach ($order_voucher_query->rows as $voucher) {
        $text .= '1x ' . $voucher['description'] . ' ' . $currency->format($voucher['amount'], $order_info['currency_code'], $order_info['currency_value']);
      }

      $text .= "\n";

      $text .= $language->get($langTextPrefix . 'order_total') . "\n";

      foreach ($order_total_query->rows as $total) {
        $text .= $total['title'] . ': ' . html_entity_decode($currency->format($total['value'], $order_info['currency_code'], $order_info['currency_value']), ENT_NOQUOTES, 'UTF-8') . "\n";
      }

      $text .= "\n";

      if ($order_info['customer_id']) {
        $text .= $language->get($langTextPrefix . 'link') . "\n";
        $text .= $order_info['store_url'] . 'index.php?route=account/order/info&order_id=' . $order_id . "\n\n";
      }

      if ($download_status) {
        $text .= $language->get($langTextPrefix . 'download') . "\n";
        $text .= $order_info['store_url'] . 'index.php?route=account/download' . "\n\n";
      }

      // Comment
      if ($order_info['comment']) {
        $text .= $language->get($langTextPrefix . 'comment') . "\n\n";
        $text .= $order_info['comment'] . "\n\n";
      }

      $text .= $language->get($langTextPrefix . 'footer') . "\n\n";

      if ($notifyCustomer) {
        $mail = new Mail();
        $mail->protocol = $config->get('config_mail_protocol');
        $mail->parameter = $config->get('config_mail_parameter');
        $mail->setTo($order_info['email']);
        $mail->setFrom($config->get('config_email'));
        $mail->{$propertyPrefix . 'hostname'} = $config->get('config_' . $configPrefix . 'smtp_host');
        $mail->{$propertyPrefix . 'username'} = $config->get('config_' . $configPrefix . 'smtp_username');
        $mail->{$propertyPrefix . 'password'} = $config->get('config_' . $configPrefix . 'smtp_password');
        $mail->{$propertyPrefix . 'port'} = $config->get('config_' . $configPrefix . 'smtp_port');
        $mail->{$propertyPrefix . 'timeout'} = $config->get('config_' . $configPrefix . 'smtp_timeout');
        $mail->setSender($storeName);
        $mail->setSubject(html_entity_decode($subject, ENT_QUOTES, 'UTF-8'));
        $mail->setHtml($html);
        $mail->setText(html_entity_decode($text, ENT_QUOTES, 'UTF-8'));
        $mail->send();
      }
    }

    if ($notifyAdmin) {
      $subject = sprintf($language->get($langTextPrefix . 'subject'), html_entity_decode($config->get('config_name'), ENT_QUOTES, 'UTF-8'), $order_id);

      if (version_compare($this->cartVars['dbVersion'], '2', '>=')) {
        // HTML Mail
        $data['text_greeting'] = $language->get($langTextPrefix . 'received');

        if ($commentFromAdmin) {
          if ($order_info['comment']) {
            $data['comment'] = nl2br($commentFromAdmin) . '<br/><br/>' . $order_info['comment'];
          } else {
            $data['comment'] = nl2br($commentFromAdmin);
          }
        } else {
          if ($order_info['comment']) {
            $data['comment'] = $order_info['comment'];
          } else {
            $data['comment'] = '';
          }
        }

        $data['text_download'] = '';

        $data['text_footer'] = '';

        $data['text_link'] = '';
        $data['link'] = '';
        $data['download'] = '';

        if (version_compare($this->cartVars['dbVersion'], '2.2', '<')) {
          if (file_exists(DIR_TEMPLATE . $config->get('config_template') . '/template/mail/order.tpl')) {
            $adminHtml = $loader->view($config->get('config_template') . '/template/mail/order.tpl', $data);
          } else {
            $adminHtml = $loader->view($themeDefaultDir . '/template/mail/order.tpl', $data);
          }
        } elseif (version_compare($this->cartVars['dbVersion'], '3', '<')) {
          $adminHtml = $loader->view($themeDefaultDir . '/template/mail/order', $data);
        } else {
          $adminHtml = $loader->view($themeDefaultDir . '/template/mail/order_add', $data);
        }
      }

      // Text
      $text  = $language->get($langTextPrefix . 'received') . "\n\n";
      $text .= $language->get($langTextPrefix . 'order_id') . ' ' . $order_id . "\n";
      $text .= $language->get($langTextPrefix . 'date_added') . ' ' . date($language->get('date_format_short'), strtotime($order_info['date_added'])) . "\n";
      $text .= $language->get($langTextPrefix . 'order_status') . ' ' . $order_status . "\n\n";
      $text .= $language->get($langTextPrefix . 'products') . "\n";

      foreach ($order_product_query->rows as $product) {
        $text .= $product['quantity'] . 'x ' . $product['name'] . ' (' . $product['model'] . ') ' . html_entity_decode($currency->format($product['total'] + ($config->get('config_tax') ? ($product['tax'] * $product['quantity']) : 0), $order_info['currency_code'], $order_info['currency_value']), ENT_NOQUOTES, 'UTF-8') . "\n";

        $order_option_query = $db->query("SELECT * FROM " . DB_PREFIX . "order_option WHERE order_id = '" . (int)$order_id . "' AND order_product_id = '" . $product['order_product_id'] . "'");

        foreach ($order_option_query->rows as $option) {
          if ($option['type'] != 'file') {
            $value = $option['value'];
          } else {
            $value = utf8_substr($option['value'], 0, utf8_strrpos($option['value'], '.'));
          }

          $text .= chr(9) . '-' . $option['name'] . ' ' . (utf8_strlen($value) > 20 ? utf8_substr($value, 0, 20) . '..' : $value) . "\n";
        }
      }

      foreach ($order_voucher_query->rows as $voucher) {
        $text .= '1x ' . $voucher['description'] . ' ' . $currency->format($voucher['amount'], $order_info['currency_code'], $order_info['currency_value']);
      }

      $text .= "\n";

      $text .= $language->get($langTextPrefix . 'order_total') . "\n";

      foreach ($order_total_query->rows as $total) {
        $text .= $total['title'] . ': ' . html_entity_decode($currency->format($total['value'], $order_info['currency_code'], $order_info['currency_value']), ENT_NOQUOTES, 'UTF-8') . "\n";
      }

      $text .= "\n";

      if ($order_info['comment']) {
        $text .= $language->get($langTextPrefix . 'comment') . "\n\n";
        $text .= $order_info['comment'] . "\n\n";
      }

      $mail = new Mail();
      $mail->protocol = $config->get('config_mail_protocol');
      $mail->parameter = $config->get('config_mail_parameter');
      $mail->{$propertyPrefix . 'hostname'} = $config->get('config_' . $configPrefix . 'smtp_host');
      $mail->{$propertyPrefix . 'username'}  = $config->get('config_' . $configPrefix . 'smtp_username');
      $mail->{$propertyPrefix . 'password'} = $config->get('config_' . $configPrefix . 'smtp_password');
      $mail->{$propertyPrefix . 'port'} = $config->get('config_' . $configPrefix . 'smtp_port');
      $mail->{$propertyPrefix . 'timeout'} = $config->get('config_' . $configPrefix . 'smtp_timeout');

      $mail->setTo($config->get('config_email'));
      $mail->setFrom($config->get('config_email'));
      $mail->setSender($storeName);
      $mail->setSubject(html_entity_decode($subject, ENT_QUOTES, 'UTF-8'));
      $mail->setText(html_entity_decode($text, ENT_QUOTES, 'UTF-8'));
      if (isset($adminHtml)) {
        $mail->setHtml($adminHtml);
      }

      $mail->send();

      // Send to additional alert emails
      $emails = explode(',', $config->get('config_alert_emails'));

      foreach ($emails as $email) {
        if ($email && preg_match('/^[^\@]+@.*\.[a-z]{2,6}$/i', $email)) {
          $mail->setTo($email);
          $mail->send();
        }
      }
    }
  }

  /**
   * @return array
   */
  public function sendReturnEmails($a2cData)
  {
    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => array(),
    );

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      require_once(DIR_SYSTEM . 'startup.php');

      if (version_compare($this->cartVars['dbVersion'], '4', '>=')) {
        $this->_sendReturnEmailV4($a2cData);
      } else {
        $this->_sendReturnEmail($a2cData);
      }
    } catch (Exception $e) {
      return $reportError($e);
    } catch (Throwable $e) {
      return $reportError($e);
    }

    return $response;
  }

  /**
   * @param array $a2cData Data
   *
   * @return void
   */
  private function _sendReturnEmail($a2cData)
  {
    $registry = new Registry();

    $loader = new Loader($registry);
    $registry->set('load', $loader);

    $db = new DB(
      DB_DRIVER,
      DB_HOSTNAME,
      DB_USERNAME,
      DB_PASSWORD,
      DB_DATABASE,
      defined('DB_PORT') ? DB_PORT : null
    );
    $registry->set('db', $db);

    $request = new Request();
    $registry->set('request', $request);

    if (version_compare($this->cartVars['dbVersion'], '2.2', '>=')) {
      $event = new Event($registry);
      $registry->set('event', $event);
    }

    $storeQuery = $db->query("
      SELECT * FROM " . DB_PREFIX . "store
      WHERE store_id = " . (int)$a2cData['store_id']);

    $config = new Config();

    if (version_compare($this->cartVars['dbVersion'], '2.2', '>=')) {
      $config->load('default');
    }

    if ($storeQuery->num_rows) {
      $config->set('config_store_id', $storeQuery->row['store_id']);
    } else {
      $config->set('config_url', HTTP_SERVER);
      $config->set('config_ssl', HTTPS_SERVER);
      $config->set('config_store_id', 0);
    }

    $settings = $db->query("
      SELECT * FROM " . DB_PREFIX . "setting
      WHERE store_id = '0' OR store_id = '" . (int)$a2cData['store_id'] . "'
      ORDER BY store_id ASC"
    );

    if (version_compare($this->cartVars['dbVersion'], '2', '<')) {
      $unserialize = function ($data) {
        return unserialize($data);
      };
    } else {
      $unserialize = function ($data) {
        return json_decode($data);
      };
    }

    foreach ($settings->rows as $setting) {
      if (!$setting['serialized']) {
        $config->set($setting['key'], $setting['value']);
      } else {
        $config->set($setting['key'], $unserialize($setting['value']));
      }
    }

    if (version_compare($this->cartVars['dbVersion'], '3', '>=')) {
      $session = new Session($config->get('session_engine'), $registry);
    } else {
      $session = new Session();
    }

    $registry->set('session', $session);

    $url = new Url($config->get('config_url'), $config->get('config_secure') ? $config->get('config_ssl') : $config->get('config_url'));
    $registry->set('url', $url);

    if (isset($session->data['language'])) {
      $languageCode = $session->data['language'];
    } else {
      $languageCode = $config->get('config_language');
    }

    $loader->model('localisation/language');

    $localisationLanguage = $registry->get('model_localisation_language');
    $languageInfo = $localisationLanguage->getLanguage($a2cData['language_id']);

    if ($languageInfo) {
      $config->set('config_language_id', $languageInfo['language_id']);
      $config->set('config_language', $languageInfo['code']);
    } else {
      $config->set('config_language_id', $config->get('config_language_id'));
      $config->set('config_language', $languageCode);
    }

    $language = new Language($languageCode);
    $language->load($languageCode);
    $registry->set('language', $language);

    $returnQuery = $db->query("
      SELECT r.*, rs.name AS status
      FROM `" . DB_PREFIX . "return` AS r
        LEFT JOIN `" . DB_PREFIX . "return_status` AS rs
          ON r.return_status_id = rs.return_status_id
        WHERE r.return_id = '" . (int)$a2cData['return_id'] . "'
          AND rs.language_id = '" . (int)$a2cData['language_id'] . "'");

    if (!empty($returnQuery->row)) {
      @require_once M1_STORE_BASE_DIR . 'admin/language/' . $languageCode . '/mail/return.php';

      $subject = sprintf(
        (isset($_['text_subject']) ? $_['text_subject'] : ''),
        html_entity_decode($config->get('config_name'), ENT_QUOTES, 'UTF-8'),
        $a2cData['return_id']
      );
      $message  = (isset($_['text_return_id']) ? $_['text_return_id'] : '') . ' ' . $a2cData['return_id'] . "\n";
      $message .= (isset($_['text_date_added']) ? $_['text_date_added'] : '')
                  . ' ' . date($language->get('date_format_short'), strtotime($returnQuery->row['date_added'])) . "\n\n";
      $message .= (isset($_['text_return_status']) ? $_['text_return_status'] : '') . "\n";
      $message .= $returnQuery->row['status'] . "\n\n";

      if ($a2cData['comment']) {
        if (isset($_['text_comment'])) {
          $message .= $_['text_comment'] . "\n\n";
        } else {
          $message .= "\n\n";
        }

        $message .= strip_tags(html_entity_decode($a2cData['comment'], ENT_QUOTES, 'UTF-8')) . "\n\n";
      }

      if (isset($_['text_footer'])) {
        $message .= $_['text_footer'];
      }

      $mail = new Mail();
      $mail->protocol = $config->get('config_mail_protocol');
      $mail->parameter = $config->get('config_mail_parameter');
      $mail->smtp_hostname = $config->get('config_mail_smtp_hostname');
      $mail->smtp_username = $config->get('config_mail_smtp_username');
      $mail->smtp_password = html_entity_decode($config->get('config_mail_smtp_password'), ENT_QUOTES, 'UTF-8');
      $mail->smtp_port = $config->get('config_mail_smtp_port');
      $mail->smtp_timeout = $config->get('config_mail_smtp_timeout');

      $mail->setTo($returnQuery->row['email']);
      $mail->setFrom($config->get('config_email'));
      $mail->setSender(html_entity_decode($config->get('config_name'), ENT_QUOTES, 'UTF-8'));
      $mail->setSubject($subject);
      $mail->setText($message);
      $mail->send();
    }
  }

  /**
   * @param array $a2cData Data
   *
   * @return void
   */
  private function _sendReturnEmailV4($a2cData)
  {
    require_once(M1_STORE_BASE_DIR . 'admin/model/sale/returns.php');
    require_once(M1_STORE_BASE_DIR . 'admin/model/sale/order.php');

    $autoloader = new \Opencart\System\Engine\Autoloader();
    $autoloader->register('Opencart\Extension', DIR_EXTENSION);
    $autoloader->register('Opencart\System', DIR_SYSTEM);

    $registry = new \Opencart\System\Engine\Registry();
    $registry->set('autoloader', $autoloader);

    $config = new \Opencart\System\Engine\Config();
    $config->addPath(DIR_CONFIG);
    $registry->set('config', $config);

    $config->load('default');
    $config->load('catalog');
    $config->set('application', 'Catalog');

    $event = new \Opencart\System\Engine\Event($registry);
    $registry->set('event', $event);

    if ($config->has('action_event')) {
      foreach ($config->get('action_event') as $key => $value) {
        foreach ($value as $priority => $action) {
          $event->register($key, new \Opencart\System\Engine\Action($action), $priority);
        }
      }
    }

    $loader = new \Opencart\System\Engine\Loader($registry);
    $registry->set('load', $loader);

    $request = new \stdClass();
    $request->get = [];
    $request->post = [];
    $request->server = $_SERVER;
    $request->cookie = [];

    $registry->set('request', $request);

    $response = new \Opencart\System\Library\Response();
    $registry->set('response', $response);

    $db = new \Opencart\System\Library\DB(DB_DRIVER, DB_HOSTNAME, DB_USERNAME, DB_PASSWORD, DB_DATABASE);

    $registry->set('db', $db);
    $registry->set('cache', new Opencart\System\Library\Cache('File'));

    $session = new \Opencart\System\Library\Session($config->get('session_engine'), $registry);
    $registry->set('session', $session);

    if ($apiSession = $session->data['api_session']) {
      $sessionId = $apiSession;
    } else {
      $sessionId = '';
    }

    $session->start($sessionId);
    $session->data['api_id'] = (int)$config->get('config_api_id');

    $template = new \Opencart\System\Library\Template($config->get('template_engine'));
    $template->addPath(M1_STORE_BASE_DIR . 'admin/view/template/');
    $registry->set('template', $template);

    if (isset($session->data['language'])) {
      $languageCode = $session->data['language'];
    } else {
      $languageCode = $config->get('config_language');
    }

    $loader->model('localisation/language');

    $localisationLanguage = $registry->get('model_localisation_language');
    $languageInfo = $localisationLanguage->getLanguageByCode($languageCode);

    if ($languageInfo) {
      $config->set('config_language_id', $languageInfo['language_id']);
      $config->set('config_language', $languageInfo['code']);
    } else {
      $config->set('config_language_id', $config->get('config_language_id'));
      $config->set('config_language', $languageCode);
    }

    $language = new \Opencart\System\Library\Language($languageCode);
    $language->addPath(DIR_APPLICATION . 'language/');
    $language->load($languageCode);
    $registry->set('language', $language);

    if (!isset($session->data['currency'])) {
      $session->data['currency'] = $config->get('config_currency');
    }

    if (isset($a2cData['store_id'])) {
      $config->set('config_store_id', (int)$a2cData['store_id']);
    } else {
      $config->set('config_store_id', 0);
    }

    $registry->set('url', new \Opencart\System\Library\Url($config->get('site_url')));
    $registry->set('document', new \Opencart\System\Library\Document());

    $session->data['api_id'] = $config->get('config_api_id');

    $preActions = [
      'startup/setting',
      'startup/extension',
      'startup/customer',
      'startup/tax',
      'startup/currency',
      'startup/application',
      'startup/startup',
      'startup/event',
    ];

    foreach ($preActions as $preAction) {
      $loader->controller($preAction);
    }

    $returnModel = new \Opencart\Admin\Model\Sale\Returns($registry);
    $returnInfo = $returnModel->getReturn($a2cData['return_id']);

    if ($returnInfo) {
      $orderInfo = $db->query("
        SELECT store_name, store_url
        FROM " . DB_PREFIX . "order 
        WHERE order_id = " . (int)$returnInfo['order_id']);

      if (isset($orderInfo->row['store_name'], $orderInfo->row['store_url'])) {
        $storeName = html_entity_decode($orderInfo->row['store_name'], ENT_QUOTES, 'UTF-8');
        $storeUrl = $orderInfo->row['store_url'];
      } else {
        $storeName = html_entity_decode($config->get('config_name'), ENT_QUOTES, 'UTF-8');
        $storeUrl = HTTP_CATALOG;
      }

      $languageInfo = $registry->get('model_localisation_language')->getLanguage($returnInfo['language_id']);

      if ($languageInfo) {
        $languageCode = $languageInfo['code'];
      } else {
        $languageCode = $config->get('config_language');
      }

      $language->load($languageCode, 'mail', $languageCode);
      $language->load('mail/returns', 'mail', $languageCode);

      $returnStatuses = $db->query("
        SELECT rs.return_status_id, rs.name
        FROM " . DB_PREFIX . "return_status AS rs
        WHERE rs.language_id = " . (int)$languageInfo['language_id']
      );
      $returnStatus = null;

      if (!empty($returnStatuses->rows)) {
        foreach ($returnStatuses->rows as $row) {
          if ((int)$row['return_status_id'] === (int)$returnInfo['return_status_id']) {
            $returnStatus = $row['name'];
            break;
          }
        }
      }

      $subject = sprintf($language->get('text_subject'), $storeName, $returnInfo['return_id']);

      $data['return_id'] = $returnInfo['return_id'];
      $data['date_added'] = date("{$language->get('mail_date_format_short')}", strtotime($returnInfo['date_modified']));
      $data['return_status'] = $returnStatus;
      $data['comment'] = nl2br($a2cData['comment']);

      $data['store'] = $storeName;
      $data['store_url'] = $storeUrl;

      $mail = new \Opencart\System\Library\Mail($config->get('config_mail_engine'));
      $mail->parameter = $config->get('config_mail_parameter');
      $mail->smtp_hostname = $config->get('config_mail_smtp_hostname');
      $mail->smtp_username = $config->get('config_mail_smtp_username');
      $mail->smtp_password = html_entity_decode($config->get('config_mail_smtp_password'), ENT_QUOTES, 'UTF-8');
      $mail->smtp_port = $config->get('config_mail_smtp_port');
      $mail->smtp_timeout = $config->get('config_mail_smtp_timeout');

      $mail->setTo($returnInfo['email']);
      $mail->setFrom($config->get('config_email'));
      $mail->setSender($storeName);
      $mail->setSubject($subject);
      $mail->setHtml($loader->view('mail/returns', $data));
      $mail->send();
    }
  }

  /**
   * @param int    $order_id         OrderId
   * @param string $commentFromAdmin Admin message to the customer
   *
   * @return void
   *
   * @throws Exception
   */
  private function _sendNewOrderEmailNotificationsV4($order_id, $commentFromAdmin)
  {
    $autoloader = new \Opencart\System\Engine\Autoloader();
    $autoloader->register('Opencart\\' . APPLICATION, DIR_APPLICATION);
    $autoloader->register('Opencart\Extension', DIR_EXTENSION);
    $autoloader->register('Opencart\System', DIR_SYSTEM);

    require_once(DIR_SYSTEM . 'vendor.php');

    // Registry
    $registry = new \Opencart\System\Engine\Registry();
    $registry->set('autoloader', $autoloader);

    // Config
    $config = new \Opencart\System\Engine\Config();
    $registry->set('config', $config);
    $config->addPath(DIR_CONFIG);

    // Load the default config
    $config->load('default');
    $config->load(strtolower(APPLICATION));

    // Set the default application
    $config->set('application', APPLICATION);

    // Set the default time zone
    date_default_timezone_set($config->get('date_timezone'));

    // Logging
    $log = new \Opencart\System\Library\Log($config->get('error_filename'));
    $registry->set('log', $log);

    // Event
    $event = new \Opencart\System\Engine\Event($registry);
    $registry->set('event', $event);

    // Event Register
    if ($config->has('action_event')) {
      foreach ($config->get('action_event') as $key => $value) {
        foreach ($value as $priority => $action) {
          $event->register($key, new \Opencart\System\Engine\Action($action), $priority);
        }
      }
    }

    // Loader
    $loader = new \Opencart\System\Engine\Loader($registry);
    $registry->set('load', $loader);

    // Request
    $request = new \Opencart\System\Library\Request();
    $registry->set('request', $request);

    // Response
    $response = new \Opencart\System\Library\Response();
    $registry->set('response', $response);

    $db = new \Opencart\System\Library\DB($config->get('db_engine'), $config->get('db_hostname'), $config->get('db_username'), $config->get('db_password'), $config->get('db_database'), $config->get('db_port'));
    $registry->set('db', $db);

    // Cache
    $registry->set('cache', new \Opencart\System\Library\Cache($config->get('cache_engine'), $config->get('cache_expire')));

    // Template
    $template = new \Opencart\System\Library\Template($config->get('template_engine'));
    $registry->set('template', $template);
    $template->addPath(DIR_TEMPLATE);

    // Language
    $language = new \Opencart\System\Library\Language($config->get('language_code'));
    $language->addPath(DIR_LANGUAGE);
    $language->load('default');
    $registry->set('language', $language);

    // Url
    $registry->set('url', new \Opencart\System\Library\Url($config->get('site_url')));

    // Document
    $registry->set('document', new \Opencart\System\Library\Document());

    // Pre Actions
    foreach ($config->get('action_pre_action') as $pre_action) {
      $pre_action = new \Opencart\System\Engine\Action($pre_action);
      $pre_action->execute($registry);
    }

    $checkout = new \Opencart\Catalog\Model\Checkout\Order($registry);
    $registry->set('model_checkout_order', $checkout);
    $order_info = $checkout->getOrder($order_id);

    $order_info['payment_method']['name'] = isset($order_info['payment_method']['name']) ? $order_info['payment_method']['name'] : '';
    $order_info['shipping_method']['name'] = isset($order_info['shipping_method']['name']) ? $order_info['shipping_method']['name'] : '';

    $mailOrder = new \Opencart\Catalog\Controller\Mail\Order($registry);
    $mailOrder->add($order_info, $order_info['order_status_id'], $commentFromAdmin, '');
  }

  /**
   * @param array $a2cData Data
   *
   * @return array|mixed
   */
  public function createLiveShippingService($a2cData)
  {
    $bridgeResponse = [
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => [],
    ];

    $reportError = function ($e) use ($bridgeResponse) {
      return $this->_getBridgeError($e, $bridgeResponse, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      ob_start();
      require_once(DIR_SYSTEM . 'startup.php');
      ob_end_clean();

      if (version_compare($this->cartVars['dbVersion'], '4', '>=')) {
        $extensionId = $this->_createLiveShippingServiceForOC4($a2cData);
      } else {
        $extensionId = $this->_createLiveShippingServiceForOC3($a2cData);
      }

      $bridgeResponse['result'] = ['extension_slug' => $extensionId];
    } catch (Exception $e) {
      return $reportError($e);
    } catch (Throwable $e) {
      return $reportError($e);
    }

    return $bridgeResponse;
  }

  /**
   * @param array $a2cData Data
   *
   * @return string
   * @throws Exception
   */
  private function _createLiveShippingServiceForOC3($a2cData)
  {
    // Must be called before require_once
    $registry = $this->_getOC3Registry();
    require_once (
      str_replace('//', '/', str_replace('catalog', 'admin', DIR_APPLICATION))
      . 'controller/extension/shipping/' . self::A2C_LIVE_SHIPPING_RATES . '.php'
    );

    $extensionController = new ControllerExtensionShippingA2cLiveShippingRates($registry);
    $extensionSlug = 'a2c_' . strtolower(str_replace(' ', '_', $a2cData['name']));

    if ($extensionController->isShippingServiceExistsById($extensionSlug)) {
      throw new Exception("Shipping service with id '{$extensionSlug}' already exists.");
    }

    $extensionController->createShippingService($a2cData, $extensionSlug);

    return $extensionSlug;
  }

  /**
   * @return mixed
   */
  private function _getOC3Registry()
  {
    $registry = new Registry();

    $loader = new Loader($registry);
    $registry->set('load', $loader);

    $db = new DB(
      DB_DRIVER,
      DB_HOSTNAME,
      DB_USERNAME,
      DB_PASSWORD,
      DB_DATABASE,
      defined('DB_PORT') ? DB_PORT : null
    );
    $registry->set('db', $db);

    $request = new Request();
    $registry->set('request', $request);

    $event = new Event($registry);
    $registry->set('event', $event);

    $config = new Config();
    $config->load('default');

    $config->set('config_url', HTTP_SERVER);
    $config->set('config_ssl', HTTPS_SERVER);
    $config->set('config_store_id', 0);

    $settings = $db->query("
      SELECT * FROM " . DB_PREFIX . "setting
      WHERE store_id = '0'
      ORDER BY store_id ASC"
    );

    $unserialize = function ($data) {
      return json_decode($data);
    };

    foreach ($settings->rows as $setting) {
      if (!$setting['serialized']) {
        $config->set($setting['key'], $setting['value']);
      } else {
        $config->set($setting['key'], $unserialize($setting['value']));
      }
    }

    $session = new Session($config->get('session_engine'), $registry);
    $registry->set('session', $session);

    $url = new Url($config->get('config_url'), $config->get('config_secure') ? $config->get('config_ssl') : $config->get('config_url'));
    $registry->set('url', $url);

    if (isset($session->data['language'])) {
      $languageCode = $session->data['language'];
    } else {
      $languageCode = $config->get('config_language');
    }

    $loader->model('localisation/language');

    $config->set('config_language_id', $config->get('config_language_id'));
    $config->set('config_language', $languageCode);

    $language = new Language($languageCode);
    $language->load($languageCode);
    $registry->set('language', $language);

    return $registry;
  }

  /**
   * @param array $a2cData Data
   *
   * @return string
   * @throws Exception
   */
  private function _createLiveShippingServiceForOC4($a2cData)
  {
    // Must be called before require_once
    $registry = $this->_getOC4Registry();

    require_once(DIR_SYSTEM . 'engine/controller.php');
    require_once(DIR_EXTENSION . self::A2C_PLUGIN_LIVE_SHIPPING_RATES_SLUG_OC4 . '/admin/controller/shipping/' . self::A2C_LIVE_SHIPPING_RATES . '.php');

    $extensionController = new Opencart\Admin\Controller\Extension\Api2cartLiveShippingRatesOc4\Shipping\A2cLiveShippingRates($registry);
    $extensionSlug = 'a2c_' . trim(
      str_replace(
        '\\',
        '/',
        strtolower(preg_replace('~([a-z])([A-Z]|[0-9])~', '\\1_\\2', str_replace(' ', '_', strtolower($a2cData['name']))))
      ),
      '/'
    );

    if ($extensionController->isShippingServiceExistsById($extensionSlug)) {
      throw new Exception("Shipping service with id '{$extensionSlug}' already exists.");
    }

    $extensionController->createShippingService($a2cData, $extensionSlug);

    return $extensionSlug;
  }

  /**
   * @return mixed
   */
  private function _getOC4Registry()
  {
    $autoloader = new \Opencart\System\Engine\Autoloader();
    $autoloader->register('Opencart\\' . APPLICATION, DIR_APPLICATION);
    $autoloader->register('Opencart\Extension', DIR_EXTENSION);
    $autoloader->register('Opencart\System', DIR_SYSTEM);

    require_once(DIR_SYSTEM . 'vendor.php');

    // Registry
    $registry = new \Opencart\System\Engine\Registry();
    $registry->set('autoloader', $autoloader);

    // Config
    $config = new \Opencart\System\Engine\Config();
    $registry->set('config', $config);
    $config->addPath(DIR_CONFIG);

    // Load the default config
    $config->load('default');
    $config->load(strtolower(APPLICATION));

    // Set the default application
    $config->set('application', APPLICATION);

    // Set the default time zone
    date_default_timezone_set($config->get('date_timezone'));

    // Logging
    $log = new \Opencart\System\Library\Log($config->get('error_filename'));
    $registry->set('log', $log);

    // Event
    $event = new \Opencart\System\Engine\Event($registry);
    $registry->set('event', $event);

    // Event Register
    if ($config->has('action_event')) {
      foreach ($config->get('action_event') as $key => $value) {
        foreach ($value as $priority => $action) {
          $event->register($key, new \Opencart\System\Engine\Action($action), $priority);
        }
      }
    }

    // Loader
    $loader = new \Opencart\System\Engine\Loader($registry);
    $registry->set('load', $loader);

    // Request
    $request = new \Opencart\System\Library\Request();
    $registry->set('request', $request);

    // Response
    $response = new \Opencart\System\Library\Response();
    $registry->set('response', $response);

    // Controller
    $controller = new \Opencart\System\Engine\Controller($registry);
    $registry->set('controller', $controller);

    return $registry;
  }

  /**
   * @param array $a2cData Data
   *
   * @return array|mixed
   */
  public function deleteLiveShippingService($a2cData)
  {
    $bridgeResponse = [
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => [],
    ];

    $reportError = function ($e) use ($bridgeResponse) {
      return $this->_getBridgeError($e, $bridgeResponse, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      ob_start();
      require_once(DIR_SYSTEM . 'startup.php');
      ob_end_clean();

      if (version_compare($this->cartVars['dbVersion'], '4', '>=')) {
        $this->_deleteLiveShippingServiceForOC4($a2cData);
      } else {
        $this->_deleteLiveShippingServiceForOC3($a2cData);
      }

      $bridgeResponse['result'] = true;
    } catch (Exception $e) {
      return $reportError($e);
    } catch (Throwable $e) {
      return $reportError($e);
    }

    return $bridgeResponse;
  }

  /**
   * @param array $a2cData Data
   *
   * @return void
   * @throws Exception
   */
  private function _deleteLiveShippingServiceForOC4($a2cData)
  {
    // Must be called before require_once
    $registry = $this->_getOC4Registry();

    require_once(DIR_SYSTEM . 'engine/controller.php');
    require_once(DIR_EXTENSION . self::A2C_PLUGIN_LIVE_SHIPPING_RATES_SLUG_OC4 . '/admin/controller/shipping/' . self::A2C_LIVE_SHIPPING_RATES . '.php');

    $extensionController = new Opencart\Admin\Controller\Extension\Api2cartLiveShippingRatesOc4\Shipping\A2cLiveShippingRates($registry);
    $extensionController->deleteShippingService($a2cData['extension_slug']);
  }

  /**
   * @param array $a2cData Data
   *
   * @return void
   * @throws Exception
   */
  private function _deleteLiveShippingServiceForOC3($a2cData)
  {
    // Must be called before require_once
    $registry = $this->_getOC3Registry();
    require_once (
      str_replace('//', '/', str_replace('catalog', 'admin', DIR_APPLICATION))
      . 'controller/extension/shipping/' . self::A2C_LIVE_SHIPPING_RATES . '.php'
    );

    $extensionController = new ControllerExtensionShippingA2cLiveShippingRates($registry);
    $extensionController->deleteShippingService($a2cData['extension_slug']);
  }

  /**
   * @param array $a2cData Data
   *
   * @return array|mixed
   */
  public function orderCalculate($a2cData)
  {
    $response = [
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => [],
    ];

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      if (version_compare($this->cartVars['dbVersion'], '4', '>=')) {
        $response['result'] = $this->_orderCalculateOC4($a2cData);
      } else {
        $response['result'] = $this->_orderCalculateOC3($a2cData);
      }
    } catch (Exception $e) {
      return $reportError($e);
    }

    return $response;
  }

  /**
   * @param array $a2cData Data
   *
   * @return array
   */
  protected function _orderCalculateOC4($a2cData)
  {
    //Load OpenCart core with output protection, if Debug Mode is enabled
    ob_start();
    require_once DIR_OPENCART . 'config.php';
    require_once DIR_SYSTEM . 'startup.php';
    require_once DIR_SYSTEM . 'framework.php';
    ob_end_clean();

    $session = $registry->get('session');
    $cart = $registry->get('cart');
    $customer = $registry->get('customer');

    //Set store ID
    $config->set('config_store_id', $a2cData['store_id']);

    //Start new session
    $session->start();

    //Set currency
    if (isset($a2cData['currency'])) {
      $session->data['currency'] = $a2cData['currency'];
    } else {
      $session->data['currency'] = $config->get('config_currency');
    }

    //If customer exists, login
    if ($customer->login($a2cData['email'], '', true)) {
      $customerData = [
        'id'         => $customer->getId(),
        'email'      => $customer->getEmail(),
        'first_name' => $customer->getFirstName(),
        'last_name'  => $customer->getLastName(),
        'phone'      => $customer->getTelephone(),
      ];
    } else {
      $session->data['guest'] = [
        'customer_group_id' => $config->get('config_customer_group_id'),
        'firstname'         => $a2cData['shipping']['firstname'],
        'lastname'          => $a2cData['shipping']['lastname'],
        'email'             => $a2cData['email'],
      ];
      $customerData = [];
    }

    //Clear before calculation
    $cart->clear();

    //Add products to cart
    foreach ($a2cData['items'] as $item) {
      $cart->add($item['product_id'], $item['quantity'], empty($item['options']) ? [] : $item['options']);
    }

    $session->data['payment_address'] = $a2cData['billing'];
    $session->data['shipping_address'] = $a2cData['shipping'];

    $products = [];
    $appliedTaxes = [];
    $appliedDiscounts = [];
    $shippingRates = [];
    $totals = [];
    $totalTax = 0;
    $total  = 0;
    $totalDiscount = 0;

    $currencyHelper = $registry->get('currency');
    $weightHelper = $registry->get('weight');
    $taxHelper = $registry->get('tax');

    //Clear default rates
    if (method_exists( $taxHelper, 'unsetRates')) {
      $taxHelper->unsetRates();
    } else {
      $taxHelper->clear();
    }

    //Load new by addresses
    $taxHelper->setShippingAddress($session->data['shipping_address']['country_id'], $session->data['shipping_address']['zone_id']);
    $taxHelper->setPaymentAddress($session->data['payment_address']['country_id'], $session->data['payment_address']['zone_id']);

    $taxes = $cart->getTaxes();
    $cartProducts = $cart->getProducts();

    $loader->model('catalog/product');
    $productModel = $registry->get('model_catalog_product');

    //Conver from system currency to provided currency
    $getConvertedValue = function ($value) use ($config, $session, $currencyHelper) {
      return $currencyHelper->convert($value, $config->get('config_currency'), $session->data['currency']);
    };

    //Check if product added to cart
    foreach ($a2cData['items'] as $item) {
      $productAdded = false;

      if ($cartProducts) {
        foreach ($cartProducts as $cartProduct) {
          if ($cartProduct['product_id'] == $item['product_id']) {
            if (empty($cartProduct['options'])) {
              $productAdded = true;
              break;
            } else {
              $cartProductOptions = array_column($cartProduct['options'], 'product_option_value_id', 'product_option_id');
              ksort($cartProductOptions);
              ksort($item['options']);

              if ($item['options'] === $cartProductOptions) {
                $productAdded = true;
                break;
              }
            }
          }
        }
      }

      if (!$productAdded) {
        throw new Exception("Product unavailable. Product data: " . json_encode($item));
      }
    }

    //Get cart products
    if (!empty($cartProducts)) {
      foreach ($cartProducts as $cartProduct) {
        $productInfo = $productModel->getProduct($cartProduct['product_id']);
        $priceIncTax = $taxHelper->calculate($cartProduct['price'], $cartProduct['tax_class_id'], true);
        $tax = $priceIncTax - $cartProduct['price'];
        $options = [];

        if (!empty($cartProduct['option'])) {
          foreach ($cartProduct['option'] as $option) {
            $options[] = [
              'product_option_id'       => $option['product_option_id'],
              'product_option_value_id' => $option['product_option_value_id'],
              'name'                    => $option['name'],
              'value'                   => $option['value'],
              'price'                   => $getConvertedValue($option['price_prefix'] === '+' ? (float)$option['price'] : (-(float)$option['price'])),
              'weight'                  => $getConvertedValue($option['weight_prefix'] === '+' ? (float)$option['weight'] : (-(float)$option['weight'])),
              'type'                    => $option['type'],
            ];
          }
        }

        $products[] = [
          'id'            => $cartProduct['product_id'],
          'quantity'      => $cartProduct['quantity'],
          'model'         => $cartProduct['model'],
          'master_id'     => $cartProduct['master_id'],
          'name'          => $cartProduct['name'],
          'price'         => $getConvertedValue($cartProduct['price']),
          'price_inc_tax' => $getConvertedValue($priceIncTax),
          'tax'           => $tax,
          'rate'          => ($tax > 0 && $cartProduct['price'] > 0) ? $tax / $cartProduct['price'] : 0,
          'weight'        => $cartProduct['weight'],
          'sku'           => empty($cartProduct['sku']) ? $productInfo['sku'] : $cartProduct['sku'],
          'weight_unit'   => $weightHelper->getUnit($cartProduct['weight_class_id']),
          'options'       => $options,
        ];
      }
    }

    //Add coupon
    if (isset($a2cData['coupon_code'])) {
      $loader->model('marketing/coupon');
      $couponInfo = $registry->get('model_marketing_coupon')->getCoupon($a2cData['coupon_code']);

      if (!empty($couponInfo)) {
        $session->data['coupon'] = $couponInfo['code'];
      }
    }

    //Load totals extensions, required to calculate subtotal,taxes, discount, etc.
    $loader->model('setting/extension');

    foreach ($registry->get('model_setting_extension')->getExtensionsByType('total') as $extension) {
      $code = $extension['code'];

      if (!$config->get('total_' . $code . '_status')) {
        continue;
      }

      $route = 'extension/' . $extension['extension'] . '/total/' . $code;
      $loader->model($route);
      $modelKey = 'model_' . str_replace('/', '_', $route);
      $fallbackKey = 'fallback_' . $modelKey;

      if ($registry->has($fallbackKey)) {
        $realModel = $registry->get($fallbackKey);
        $realModel->getTotal($totals, $taxes, $total);
      } elseif ($registry->has($modelKey)) {
        $class = 'Opencart\\Catalog\\Model\\Extension\\' . ucfirst($extension['extension']) . '\\Total\\' . str_replace(['_', '/'], ['', '\\'], ucwords($code, '_/'));

        if (class_exists($class)) {
          $model = new $class($registry);
          $model->getTotal($totals, $taxes, $total);
        }
      }
    }

    $grandTotal = 0;

    if (!empty($totals)) {
      foreach ($totals as $totalData) {
        if (in_array($totalData['code'], ['coupon', 'reward', 'voucher', 'discount'])) {
          $totalDiscount += abs((float)$totalData['value']);
        }

        if ($totalData['code'] === 'coupon') {
          $appliedDiscounts[] = [
            'value'    => $getConvertedValue(abs((float)$totalData['value'])),
            'code'     => $couponInfo['code'],
            'name'     => empty($couponInfo['title']) ? $couponInfo['name'] : $couponInfo['name'],
            'shipping' => (bool)$couponInfo['shipping'],
          ];
        }

        if ($totalData['code'] === 'total') {
          $grandTotal = $totalData['value'];
        }
      }
    }

    $subtotal = $cart->getSubTotal();

    //If coupon discount greater or equal to cart total
    if ($grandTotal === $totalDiscount) {
      foreach ($appliedDiscounts as $key => $discount) {
        $appliedDiscounts[$key]['value'] = $getConvertedValue($subtotal);
      }

      $totalDiscount = $getConvertedValue($subtotal);
    }

    //Must be called after initialization of totals extensions
    if (!empty($taxes)) {
      $taxRateQuery = $registry->get('db')->query("SELECT * FROM " . DB_PREFIX . "tax_rate WHERE tax_rate_id IN (" . implode(',', array_keys($taxes)) . ")");

      if (!empty($taxRateQuery->rows)) {
        foreach ($taxes as $taxId => $amount) {
          foreach ($taxRateQuery->rows as $taxRow) {
            if ((int)$taxRow['tax_rate_id'] === $taxId) {
              if (strtolower($taxRow['type']) === 'p') {
                $rate = (float)$taxRow['rate'] / 100;
              } else {
                $rate = (float)$taxRow['rate'];
              }

              $appliedTaxes[] = [
                'name'   => $taxRow['name'],
                'rate'   => $rate,
                'amount' => $getConvertedValue($amount),
                'type'   => $taxRow['type'],
              ];

              $totalTax += $amount;
            }
          }
        }
      }
    }

    //Load shipping extensions
    $loader->model('checkout/shipping_method');

    try {
      $shippingMethods = $registry->get('model_checkout_shipping_method')->getMethods($session->data['shipping_address']);
    } catch (Error $e) {
      if (stripos($e->getMessage(), "undefined constant") !== false
        && stripos($e->getMessage(), "version") !== false
      ) {
        define('VERSION', $config->get('config_version'));
        $shippingMethods = $registry->get('model_checkout_shipping_method')->getMethods($session->data['shipping_address']);
      } else {
        throw $e;
      }
    }

    if (!empty($shippingMethods)) {
      foreach ($shippingMethods as $shippingMethod) {
        foreach ($shippingMethod['quote'] as $quote) {
          $cost = (float)$quote['cost'];
          $priceIncTax = $taxHelper->calculate($cost, $quote['tax_class_id'], true);
          $tax = $priceIncTax - $cost;

          $shippingRates[] = [
            'code'           => $quote['code'],
            'title'          => empty($quote['title']) ? $quote['name'] : $quote['title'],
            'price'          => $getConvertedValue($cost),
            'price_incl_tax' => $getConvertedValue($priceIncTax),
            'tax'            => $getConvertedValue($tax),
            'rate'           => ($tax > 0 && $cost > 0) ? $tax / $cost : 0
          ];
        }
      }
    }

    $calculatedOrder = [
      'products'           => $products,
      'shipping_rates'     => $shippingRates,
      'currency'           => empty($session->data['currency']) ? $config->get('config_currency') : $session->data['currency'],
      'customer'           => $customerData,
      'taxes'              => $appliedTaxes,
      'subtotal'           => $getConvertedValue($subtotal),
      'tax'                => $getConvertedValue($totalTax),
      'discount'           => $getConvertedValue($totalDiscount),
      'discounts'          => $appliedDiscounts,
    ];

    //Delete cart from DB and clear session
    $cart->clear();
    $session->data = [];

    while (ob_get_level() > 0) {
      ob_end_clean();
    }

    return $calculatedOrder;
  }

  /**
   * @param array $a2cData Data
   *
   * @return array
   */
  protected function _orderCalculateOC3($a2cData)
  {
    ob_start();

    if (is_file('config.php')) {
      require_once 'config.php';
    }

    require_once DIR_SYSTEM . 'startup.php';

    // variable $application_config used in framework.php
    $application_config = 'catalog';
    require_once DIR_SYSTEM . 'framework.php';
    ob_end_clean();

    $session = $registry->get('session');
    $cart = $registry->get('cart');
    $customer = $registry->get('customer');

    //Set store ID
    $config->set('config_store_id', $a2cData['store_id']);

    //Start new session
    $session->start();

    //Set currency
    if (isset($a2cData['currency'])) {
      $session->data['currency'] = $a2cData['currency'];
    } else {
      $session->data['currency'] = $config->get('config_currency');
    }

    //If customer exists, login
    if ($customer->login($a2cData['email'], '', true)) {
      $customerData = [
        'id'         => $customer->getId(),
        'email'      => $customer->getEmail(),
        'first_name' => $customer->getFirstName(),
        'last_name'  => $customer->getLastName(),
        'phone'      => $customer->getTelephone(),
      ];
    } else {
      $session->data['guest'] = [
        'customer_group_id' => $config->get('config_customer_group_id'),
        'firstname'         => $a2cData['shipping']['firstname'],
        'lastname'          => $a2cData['shipping']['lastname'],
        'email'             => $a2cData['email'],
      ];
      $customerData = [];
    }

    //Clear before calculation
    $cart->clear();

    //Add products to cart
    foreach ($a2cData['items'] as $item) {
      $cart->add($item['product_id'], $item['quantity'], empty($item['options']) ? [] : $item['options']);
    }

    $session->data['payment_address'] = $a2cData['billing'];
    $session->data['shipping_address'] = $a2cData['shipping'];

    $products = [];
    $appliedTaxes = [];
    $appliedDiscounts = [];
    $shippingRates = [];
    $totals = [];
    $totalTax = 0;
    $total  = 0;
    $totalDiscount = 0;

    $totalData = [
      'totals' => &$totals,
      'taxes'  => &$taxes,
      'total'  => &$total
    ];

    $currencyHelper = $registry->get('currency');
    $weightHelper = $registry->get('weight');
    $taxHelper = $registry->get('tax');

    //Clear default rates
    if (method_exists( $taxHelper, 'unsetRates')) {
      $taxHelper->unsetRates();
    } else {
      $taxHelper->clear();
    }

    //Load new by addresses
    $taxHelper->setShippingAddress($session->data['shipping_address']['country_id'], $session->data['shipping_address']['zone_id']);
    $taxHelper->setPaymentAddress($session->data['payment_address']['country_id'], $session->data['payment_address']['zone_id']);

    $taxes = $cart->getTaxes();
    $cartProducts = $cart->getProducts();

    $loader->model('catalog/product');
    $productModel = $registry->get('model_catalog_product');

    //Conver from system currency to provided currency
    $getConvertedValue = function ($value) use ($config, $session, $currencyHelper) {
      return $currencyHelper->convert($value, $config->get('config_currency'), $session->data['currency']);
    };

    //Check if product added to cart
    foreach ($a2cData['items'] as $item) {
      $productAdded = false;

      if ($cartProducts) {
        foreach ($cartProducts as $cartProduct) {
          if ($cartProduct['product_id'] == $item['product_id']) {
            if (empty($cartProduct['options'])) {
              $productAdded = true;
              break;
            } else {
              $cartProductOptions = array_column($cartProduct['options'], 'product_option_value_id', 'product_option_id');
              ksort($cartProductOptions);
              ksort($item['options']);

              if ($item['options'] === $cartProductOptions) {
                $productAdded = true;
                break;
              }
            }
          }
        }
      }

      if (!$productAdded) {
        throw new Exception("Product unavailable. Product data: " . json_encode($item));
      }
    }

    //Get cart products
    if (!empty($cartProducts)) {
      foreach ($cartProducts as $cartProduct) {
        $productInfo = $productModel->getProduct($cartProduct['product_id']);
        $priceIncTax = $taxHelper->calculate($cartProduct['price'], $cartProduct['tax_class_id'], true);
        $tax = $priceIncTax - $cartProduct['price'];
        $options = [];

        if (!empty($cartProduct['option'])) {
          foreach ($cartProduct['option'] as $option) {
            $options[] = [
              'product_option_id'       => $option['product_option_id'],
              'product_option_value_id' => $option['product_option_value_id'],
              'name'                    => $option['name'],
              'value'                   => $option['value'],
              'price'                   => $getConvertedValue($option['price_prefix'] === '+' ? (float)$option['price'] : (-(float)$option['price'])),
              'weight'                  => $getConvertedValue($option['weight_prefix'] === '+' ? (float)$option['weight'] : (-(float)$option['weight'])),
              'type'                    => $option['type'],
            ];
          }
        }

        $products[] = [
          'id'            => $cartProduct['product_id'],
          'quantity'      => $cartProduct['quantity'],
          'model'         => $cartProduct['model'],
          'name'          => $cartProduct['name'],
          'price'         => $getConvertedValue($cartProduct['price']),
          'price_inc_tax' => $getConvertedValue($priceIncTax),
          'tax'           => $tax,
          'rate'          => ($tax > 0 && $cartProduct['price'] > 0) ? $tax / $cartProduct['price'] : 0,
          'weight'        => $cartProduct['weight'],
          'sku'           => empty($cartProduct['sku']) ? $productInfo['sku'] : $cartProduct['sku'],
          'weight_unit'   => $weightHelper->getUnit($cartProduct['weight_class_id']),
          'options'       => $options,
        ];
      }
    }

    if (isset($a2cData['coupon_code'])) {
      $loader->model('extension/total/coupon');
      $couponInfo = $registry->get('model_extension_total_coupon')->getCoupon($a2cData['coupon_code']);

      if (!empty($couponInfo)) {
        $session->data['coupon'] = $couponInfo['code'];
      }
    }

    //Load totals extensions, required to calculate subtotal,taxes, discount, etc.
    $loader->model('setting/extension');

    foreach ($registry->get('model_setting_extension')->getExtensions('total') as $extension) {
      $code = $extension['code'];

      if (!$config->get('total_' . $code . '_status')) {
        continue;
      }

      $route = 'extension/total/' . $code;
      $loader->model($route);
      $modelKey = 'model_' . str_replace('/', '_', $route);
      $fallbackKey = 'fallback_' . $modelKey;

      if ($registry->has($fallbackKey)) {
        $registry->get($fallbackKey)->getTotal($totalData);
      } elseif ($registry->has($modelKey)) {
        $registry->get($modelKey)->getTotal($totalData);
      }
    }

    $grandTotal = 0;

    if (!empty($totalData['totals'])) {
      foreach ($totalData['totals'] as $totalData) {
        if (in_array($totalData['code'], ['coupon', 'reward', 'voucher', 'discount'])) {
          $totalDiscount += abs((float)$totalData['value']);
        }

        if ($totalData['code'] === 'coupon') {
          $appliedDiscounts[] = [
            'value'    => $getConvertedValue(abs((float)$totalData['value'])),
            'code'     => $couponInfo['code'],
            'name'     => empty($couponInfo['title']) ? $couponInfo['name'] : $couponInfo['name'],
            'shipping' => (bool)$couponInfo['shipping'],
          ];
        }

        if ($totalData['code'] === 'total') {
          $grandTotal = $totalData['value'];
        }
      }
    }

    $subtotal = $cart->getSubTotal();

    //If coupon discount greater or equal to cart total
    if ($grandTotal === $totalDiscount) {
      foreach ($appliedDiscounts as $key => $discount) {
        $appliedDiscounts[$key]['value'] = $getConvertedValue($subtotal);
      }

      $totalDiscount = $getConvertedValue($subtotal);
    }

    //Must be called after initialization of totals extensions
    if (!empty($taxes)) {
      $taxRateQuery = $registry->get('db')->query("SELECT * FROM " . DB_PREFIX . "tax_rate WHERE tax_rate_id IN (" . implode(',', array_keys($taxes)) . ")");

      if (!empty($taxRateQuery->rows)) {
        foreach ($taxes as $taxId => $amount) {
          foreach ($taxRateQuery->rows as $taxRow) {
            if ((int)$taxRow['tax_rate_id'] === $taxId) {
              if (strtolower($taxRow['type']) === 'p') {
                $rate = (float)$taxRow['rate'] / 100;
              } else {
                $rate = (float)$taxRow['rate'];
              }

              $appliedTaxes[] = [
                'name'   => $taxRow['name'],
                'rate'   => $rate,
                'amount' => $getConvertedValue($amount),
                'type'   => $taxRow['type'],
              ];

              $totalTax += $amount;
            }
          }
        }
      }
    }

    //Load shipping extensions
    $loader->model('setting/extension');
    $shippingExtensions = $registry->get('model_setting_extension')->getExtensions('shipping');

    if (!empty($shippingExtensions)) {
      foreach ($shippingExtensions as $shippingExtension) {
        if ($config->get('shipping_' . $shippingExtension['code'] . '_status')) {
          $loader->model('extension/shipping/' . $shippingExtension['code']);
          $shippingQuote = $registry->get('model_extension_shipping_' . $shippingExtension['code'])->getQuote($session->data['shipping_address']);

          if (!empty($shippingQuote)) {
            foreach ($shippingQuote['quote'] as $quote) {
              $cost = (float)$quote['cost'];
              $priceIncTax = $taxHelper->calculate($cost, $quote['tax_class_id'], true);
              $tax = $priceIncTax - $cost;

              $shippingRates[] = [
                'code'           => $quote['code'],
                'title'          => empty($quote['title']) ? $quote['name'] : $quote['title'],
                'price'          => $getConvertedValue($cost),
                'price_incl_tax' => $getConvertedValue($priceIncTax),
                'tax'            => $getConvertedValue($tax),
                'rate'           => ($tax > 0 && $cost > 0) ? $tax / $cost : 0
              ];
            }
          }
        }
      }
    }

    $calculatedOrder = [
      'products'           => $products,
      'shipping_rates'     => $shippingRates,
      'currency'           => empty($session->data['currency']) ? $config->get('config_currency') : $session->data['currency'],
      'customer'           => $customerData,
      'taxes'              => $appliedTaxes,
      'subtotal'           => $getConvertedValue($subtotal),
      'tax'                => $getConvertedValue($totalTax),
      'discount'           => $getConvertedValue($totalDiscount),
      'discounts'          => $appliedDiscounts,
    ];

    //Delete cart from DB and clear session
    $cart->clear();
    $session->data = [];

    while (ob_get_level() > 0) {
      ob_end_clean();
    }

    return $calculatedOrder;
  }

}

/**
 * Class M1_Config_Adapter_Mijoshop
 */
class M1_Config_Adapter_Mijoshop extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_Mijoshop constructor.
   */
  public function __construct()
  {
    require_once M1_STORE_BASE_DIR . "/configuration.php";

    $mijoConf = M1_STORE_BASE_DIR . 'administrator' . DIRECTORY_SEPARATOR . 'components' . DIRECTORY_SEPARATOR . 'com_mijoshop' . DIRECTORY_SEPARATOR . 'mijoshop.xml';

    if (file_exists($mijoConf)) {
      $xml = simplexml_load_file($mijoConf);
      $this->cartVars['dbVersion'] = (string)$xml->version[0];
    }

    if (class_exists("JConfig")) {

      $jconfig = new JConfig();

      $this->setHostPort($jconfig->host);
      $this->dbname   = $jconfig->db;
      $this->username = $jconfig->user;
      $this->password = $jconfig->password;

    } else {

      $this->setHostPort($host);
      $this->dbname   = $db;
      $this->username = $user;
      $this->password = $password;
    }

    $this->imagesDir              = "components/com_mijoshop/opencart/image/";
    $this->categoriesImagesDir    = $this->imagesDir;
    $this->productsImagesDir      = $this->imagesDir;
    $this->manufacturersImagesDir = $this->imagesDir;
  }

}



/**
 * Class M1_Config_Adapter_Magento1212
 */
class M1_Config_Adapter_Magento1212 extends M1_Config_Adapter
{

  const ERROR_CODE_SUCCESS = 0;
  const ERROR_CODE_INTERNAL_ERROR = 2;

  private $_magentoVersionMajor = null;
  private $_countTry = 0;

  /**
   * M1_Config_Adapter_Magento1212 constructor.
   */
  public function __construct()
  {
    if (file_exists(M1_STORE_BASE_DIR . '../app/etc/env.php')) {
      define('M1_STORE_ROOT_DIR', realpath(M1_STORE_BASE_DIR . '..') . '/');
      $this->_magento2();
      $this->_magentoVersionMajor = 2;
    } else {
      define('M1_STORE_ROOT_DIR', M1_STORE_BASE_DIR);

      if (file_exists(M1_STORE_BASE_DIR . 'app/etc/env.php')) {
        $this->_magento2();
        $this->_magentoVersionMajor = 2;
      } else {
        $this->_magento1();
        $this->_magentoVersionMajor = 1;
      }
    }
  }

  /**
   * @param array $a2cData
   *
   * @return mixed
   * @throws Exception
   */
  public function getActiveModules($a2cData)
  {
    $response = array(
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => array(),
    );

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    if ($this->_magentoVersionMajor === 2) {
      try {
        require M1_STORE_ROOT_DIR . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'bootstrap.php';

        $bootstrap = \Magento\Framework\App\Bootstrap::create(M1_STORE_ROOT_DIR, $_SERVER);
        $objectManager = $bootstrap->getObjectManager();
        $state = $objectManager->get('Magento\Framework\App\State');
        $state->setAreaCode('global');

        /**
         * @var Magento\Framework\Module\FullModuleList $fullModuleList
         */
        $fullModuleList = $objectManager->get('\Magento\Framework\Module\FullModuleList');
        $modules = $fullModuleList->getAll();

        $response = array(
          'error_code' => self::ERROR_CODE_SUCCESS,
          'error'      => null,
          'result'     => $modules,
        );
      } catch (Exception $e) {
        return $reportError($e);
      } catch (Throwable $e) {
        return $reportError($e);
      }
    } else {
      return $reportError(new Exception('Action is not supported'));
    }

    return $response;
  }

  /**
   * @return array
   */
  public function getPaymentMethods()
  {
    $response = [
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => [],
    ];

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    if ($this->_magentoVersionMajor === 2) {
      try {
        require M1_STORE_ROOT_DIR . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'bootstrap.php';

        $bootstrap = \Magento\Framework\App\Bootstrap::create(M1_STORE_ROOT_DIR, $_SERVER);
        $objectManager = $bootstrap->getObjectManager();

        $state = $objectManager->get('Magento\Framework\App\State');
        $state->setAreaCode('adminhtml');

        $stores = $objectManager->get('\Magento\Store\Api\StoreRepositoryInterface')->getList();
        $paymentHelper = $objectManager->get('Magento\Payment\Model\PaymentMethodList');
        $allPaymentMethods = [];

        foreach ($stores as $store) {
          $payments = array_map(
            function ($item) {
              return [
                'code'     => $item->getCode(),
                'title'    => $item->getTitle(),
                'storeId'  => $item->getStoreId(),
                'isActive' => $item->getIsActive(),
              ];
            },
            $paymentHelper->getList($store->getId())
          );

          $allPaymentMethods[$store->getId()] = $payments;
        }

        $response = [
          'error_code' => self::ERROR_CODE_SUCCESS,
          'error'      => null,
          'result'     => $allPaymentMethods,
        ];
      } catch (Exception $e) {
        return $reportError($e);
      } catch (Throwable $e) {
        return $reportError($e);
      }
    } else {
      return $reportError(new Exception('Action is not supported'));
    }

    return $response;
  }

  /**
   * @return array
   */
  public function productDeleteAction($a2cData)
  {
    $response = [
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => [],
    ];

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    if ($this->_magentoVersionMajor === 2) {
      try {
        require M1_STORE_ROOT_DIR . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'bootstrap.php';

        $bootstrap = \Magento\Framework\App\Bootstrap::create(M1_STORE_ROOT_DIR, $_SERVER);
        $objectManager = $bootstrap->getObjectManager();
        $objectManager->get('Magento\Framework\Registry')->register('isSecureArea', true);

        $state = $objectManager->get('Magento\Framework\App\State');
        $state->setAreaCode('global');
        $massDelete = $objectManager->create('\Magento\Catalog\Model\ProductRepository');

        $result = [];

        foreach ($a2cData['products'] as $key => $productId) {
          $product = $objectManager->create('\Magento\Catalog\Model\Product')->load($productId['id']);

          if ($product->getId()) {
            $massDelete->delete($product);
            $result[$key]['id'] = $productId['id'];
          } else {
            $result[$key]['id'] = $productId['id'];
            $result[$key]['errors'][] = 'Product not found';
          }
        }

        $response = [
          'error_code' => self::ERROR_CODE_SUCCESS,
          'error'      => null,
          'result'     => $result,
        ];
      } catch (Exception $e) {
        return $reportError($e);
      } catch (Throwable $e) {
        return $reportError($e);
      }
    } else {
      return $reportError(new Exception('Action is not supported'));
    }

    return $response;
  }

  /**
   * @param array $a2cData
   *
   * @return mixed
   * @throws Exception
   */
  public function productUpdateAction($a2cData)
  {
    if ($this->_magentoVersionMajor === 2) {
      do {
        try {
          return $this->_productUpdateMage2($a2cData);
        } catch (Exception $e) {
          if (preg_match('/deadlock/', $e->getMessage())) {
            usleep(rand(1000000, 3000000));
          } else {
            throw $e;
          }
        }
      } while (++ $this->_countTry < 3);

      if (isset($e)) {
        throw $e;
      }
    } else {
      throw new Exception('Action is not supported');
    }
  }

  /**
   * @param array $a2cData A2C Data
   *
   * @return array
   * @throws Exception
   */
  public function productAddBatchAction($a2cData)
  {
    if ($this->_magentoVersionMajor === 2) {
      require M1_STORE_ROOT_DIR . DIRECTORY_SEPARATOR  . 'app' . DIRECTORY_SEPARATOR . 'bootstrap.php';

      $bootstrap = \Magento\Framework\App\Bootstrap::create(M1_STORE_ROOT_DIR, $_SERVER);
      $objectManager = $bootstrap->getObjectManager();
      $state = $objectManager->get('Magento\Framework\App\State');
      $state->setAreaCode('global');

      /** @var \Magento\Catalog\Model\ProductRepository $productRepo */
      $productRepo = $objectManager->get('\Magento\Catalog\Model\ProductRepository');

      /** @var \Magento\Store\Model\StoreManager $storeManager */
      $storeManager = $objectManager->get('\Magento\Store\Model\StoreManager');

      $result = [];

      foreach ($a2cData as $key => $data) {
        $result[$key] = ['id' =>null];
        $attempt = 0;
        $storeId = 0;

        if (isset($data['store_id'])) {
          $storeId = (int)$data['store_id'];
        }

        do {
          try {
            /** @var Magento\Catalog\Model\Product $product */
            $product = $objectManager->create('\Magento\Catalog\Model\ProductFactory')->create();

            $storeManager->setCurrentStore($storeId);
            $product->setStoreId($storeId);

            if (key_exists('website_ids', $data) && $data['website_ids'] !== null) {
              $product->setWebsiteIds($data['website_ids']);
            }

            $productAttributes = [];

            if (isset($data['attributes'][0])) {
              $productAttributes = $data['attributes'][0];
            }


            $storedData = $product->getStoredData();
            $productData = $product->getStoredData();

            $newData = [];

            foreach ($productAttributes as $attrCode => $value) {
              if ($attrCode === 'url_key') {
                $value = $product->getUrlModel()->formatUrlKey($value);
              }

              $attributes = $product->getAttributes();
              $hasAttribute = isset($attributes[$attrCode]);

              if (isset($productData[$attrCode])) {
                $currentValue = $productData[$attrCode];
              } else {
                if (isset($storedData[$attrCode])) {
                  $currentValue = $storedData[$attrCode];
                } else {
                  $currentValue = null;
                }
              }

              if ($hasAttribute && !$this->_isValuesEqual($currentValue, $value)) {
                if ($attrCode === 'url_key' && $data['save_rewrites_history']) {
                  $newData['url_key_create_redirect'] = $product->getUrlKey();
                  $newData['save_rewrites_history']   = true;
                }

                $newData[$attrCode] = $value;
              }
            }

            if (!empty($newData)) {
              $product->addData($newData);
            }


            if (key_exists('combination', $data) && $data['combination'] !== null) {
              /** @var \Magento\Eav\Model\Config $eavConfig */
              $eavConfig = $objectManager->create('\Magento\Eav\Model\Config');

              /** @var \Magento\Eav\Api\AttributeOptionManagementInterface $attributeOptionManagement */
              $attributeOptionManagement = $objectManager->create('\Magento\Eav\Api\AttributeOptionManagementInterface');

              foreach ($data['combination'] as $attrCode => $attrValue) {
                $attribute = $eavConfig->getAttribute(\Magento\Catalog\Model\Product::ENTITY, $attrCode);
                $optionId = $attribute->getSource()->getOptionId($attrValue);

                if ($optionId === null) {
                  /** @var \Magento\Eav\Model\Entity\Attribute\OptionLabel $optionLabel */
                  $optionLabel = $objectManager->create('\Magento\Eav\Model\Entity\Attribute\OptionLabel');
                  $optionLabel->setStoreId($storeId);
                  $optionLabel->setLabel($attrValue);

                  /** @var \Magento\Eav\Model\Entity\Attribute\Option $option */
                  $option = $objectManager->create('\Magento\Eav\Model\Entity\Attribute\Option');
                  $option->setLabel($optionLabel->getLabel());
                  $option->setStoreLabels([$optionLabel]);
                  $option->setIsDefault(false);

                  $attributeOptionManagement->add(\Magento\Catalog\Model\Product::ENTITY, $attribute->getAttributeId(), $option);
                  $optionId = $option->getId();
                }


                $product->setData($attrCode, $optionId);

              }

              if (isset($data['parent_id'])) {
                $parentProductId = $productRepo->getById($data['parent_id'], false, 0, true);

                if ($parentProductId) {
                  $product->setAttributeSetId($parentProductId->getAttributeSetId());

                  if (key_exists('website_ids', $data) && $data['website_ids'] === null) {
                    $product->setWebsiteIds($parentProductId->getExtensionAttributes()->getWebsiteIds());
                  }
                }
              }
            }

            if (key_exists('categories', $data) && $data['categories'] !== null) {
              $product->setCategoryIds($data['categories']);
            }

            if (key_exists('product_links', $data) && $data['product_links'] !== null) {
              $productLinkInterfaceFactory = $objectManager->create('\Magento\Catalog\Api\Data\ProductLinkInterfaceFactory');
              $productLinks = [];

              foreach ($data['product_links'] as $linkKey => $productLinkData) {
                /** @var Magento\Catalog\Api\Data\ProductLinkInterface $productLink */
                $productLink = $productLinkInterfaceFactory->create();

                if ($productLinkData['sku']) {
                  $sku = $productLinkData['sku'];
                } else {
                  $sku = $product->getSku();
                }

                $productLink->setSku($sku);
                $productLink->setLinkedProductSku($productLinkData['linked_product_sku']);
                $productLink->setPosition($linkKey + 1);
                $productLink->setLinkType($productLinkData['link_type']);
                $productLinks[] = $productLink;
              }

              $product->setProductLinks($productLinks);
            }

            if (key_exists('tier_prices', $data) && $data['tier_prices'] !== null) {
              $productTierPricesFactory = $objectManager->create('\Magento\Catalog\Api\Data\ProductTierPriceInterfaceFactory');
              $tierPrices = [];

              foreach ($data['tier_prices'] as $tierPriceData) {
                $tierPrice = $productTierPricesFactory->create();
                $tierPrice->setCustomerGroupId($tierPriceData['customer_group_id']);
                $tierPrice->setQty($tierPriceData['qty']);
                $tierPrice->setValue($tierPriceData['value']);
                $tierPrices[] = $tierPrice;
              }

              $product->setTierPrices($tierPrices);
            }

            if (key_exists('images', $data) && $data['images'] !== null) {
              $imageErrors = $this->_addProductGallery($product, $objectManager, $data['images']);

              if (!empty($imageErrors)) {
                $result[$key]['errors'] = $imageErrors;
              }
            }

            $product->setUrlKey($this->_generateUniqueUrlKey($product, $objectManager));

            $product = $productRepo->save($product);

            $result[$key] = ['id' => $product->getId()];

            break;
          } catch (Exception $e) {
            if (preg_match('/deadlock/', $e->getMessage())) {
              usleep(rand(1000000, 3000000));
            } else {
              $message = $e->getMessage();
              $errorKey = md5($message);
              $result[$key]['errors'][$errorKey] = ['message' => $message];

              break;
            }
          }
        } while (++ $attempt < 3);

        if (isset($e)) {
          $message = $e->getMessage();
          $errorKey = md5($message);
          $result[$key]['errors'][$errorKey] = ['code' => $e->getCode(), 'message' => $message];
        }
      }

      return $result;
    } else {
      throw new Exception('Action is not supported');
    }
  }

  /**
   * @param array $a2cData A2C Data
   *
   * @return array
   * @throws Exception
   */
  public function productUpdateBatchAction($a2cData)
  {
    if ($this->_magentoVersionMajor === 2) {
      require M1_STORE_ROOT_DIR . DIRECTORY_SEPARATOR  . 'app' . DIRECTORY_SEPARATOR . 'bootstrap.php';

      $bootstrap = \Magento\Framework\App\Bootstrap::create(M1_STORE_ROOT_DIR, $_SERVER);
      $objectManager = $bootstrap->getObjectManager();
      $state = $objectManager->get('Magento\Framework\App\State');
      $state->setAreaCode('global');

      /**
       * @var Magento\Store\Model\StoreManager $storeManager
       * @var Magento\Catalog\Model\Product $product
       * @var Magento\Catalog\Model\ProductRepository $productRepo
       * @var Magento\Framework\App\Request\DataPersistor $dataPersistor
       * @var Magento\Framework\App\Config $config
       */
      $productRepo = $objectManager->get('Magento\Catalog\Model\ProductRepository');
      $storeManager = $objectManager->get('Magento\Store\Model\StoreManager');

      $config = $objectManager->get('Magento\Framework\App\Config\ScopeConfigInterface');
      $isPricesPerWebsite = (int)$config->getValue('catalog/price/scope', Magento\Store\Model\ScopeInterface::SCOPE_WEBSITE) === 1;

      /**
       * @var Magento\CatalogInventory\Model\Configuration $stockConf
       */
      $stockConf = $objectManager->get('Magento\CatalogInventory\Model\Configuration');
      $isQtySupportedArr = $stockConf->getIsQtyTypeIds();

      /**
       * @var Magento\Framework\Module\Manager $moduleManager
       */
      $moduleManager = $objectManager->get('Magento\Framework\Module\Manager');
      $msiEnabled = $moduleManager->isEnabled('Magento_Inventory');

      $result = [];

      foreach ($a2cData as $key => $data) {
        $attempt = 0;
        $isUpdated = [];

        do {
          try {
            $result[$key] = ['id' => $data['entity_id'], 'is_updated' => false];
            $store = $storeManager->getStore((string)$data['store_id']);
            $storeManager->setCurrentStore($store->getCode());

            if (empty($data['attributes'])) {
              $product = $productRepo->getById($data['entity_id'], false, 0, true);
              $product->validate();
            } else {
              krsort($data['attributes']);

              foreach ($data['attributes'] as $storeId => $values) {
                $store = $storeManager->getStore($storeId);
                $storeManager->setCurrentStore($store->getCode());

                if ($storeId === 0) {
                  $product = $productRepo->getById($data['entity_id'], true, 0, true);
                } else {
                  $product = $this->_getProduct($objectManager, $productRepo, $data['entity_id'], $storeId, array_keys($values));
                }

                $storedData = $product->getStoredData();
                $productData = $product->getStoredData();

                $newData = array();
                foreach ($values as $attrCode => $value) {
                  if ($attrCode === 'url_key') {
                    $value = $product->getUrlModel()->formatUrlKey($value);
                  }

                  $attributes = $product->getAttributes();
                  $hasAttribute = isset($attributes[$attrCode]);

                  if (isset($productData[$attrCode])) {
                    $currentValue = $productData[$attrCode];
                  } else {
                    if (isset($storedData[$attrCode])) {
                      $currentValue = $storedData[$attrCode];
                    } else {
                      $currentValue = null;
                    }
                  }

                  if ($hasAttribute && !$this->_isValuesEqual($currentValue, $value)) {
                    if ($attrCode === 'url_key' && $data['save_rewrites_history']) {
                      $newData['url_key_create_redirect'] = $product->getUrlKey();
                      $newData['save_rewrites_history']   = true;
                    }

                    if ($storeId > 0 && $isPricesPerWebsite
                      && $attributes[$attrCode]->getBackendModel() === 'Magento\Catalog\Model\Product\Attribute\Backend\Price'
                    ) {
                      $this->setPricePerStore($objectManager, $data['entity_id'], $storeId, $attrCode, $value);
                      $isUpdated[] = true;
                    } else {
                      $newData[$attrCode] = $value;
                    }
                  }
                }

                if (!empty($newData)) {
                  $product->addData($newData);
                  $product = $productRepo->save($product);
                  $isUpdated[] = true;
                }
              }
            }

            if (!empty($data['inventory'])) {
              $isQtySupported = isset($isQtySupportedArr[$product->getTypeId()]) && $isQtySupportedArr[$product->getTypeId()];

              if (isset($data['inventory']['stockItem']) || isset($data['inventory']['a2c'])) {
                /**
                 * @var Magento\CatalogInventory\Model\StockRegistry $stockRegistry
                 */
                $stockRegistry = $objectManager->get('Magento\CatalogInventory\Model\StockRegistry');
                /**
                 * @var Magento\CatalogInventory\Model\Stock\Item $stockItem
                 */
                $stockItem = $stockRegistry->getStockItem($data['entity_id'], $store->getWebsiteId());

                if (isset($data['inventory']['stockItem'])) {
                  foreach ($data['inventory']['stockItem'] as $attrCode => $value) {
                    if ($attrCode === 'qty' && !$isQtySupported
                        || $this->_isValuesEqual($stockItem->getData($attrCode), $value)
                    ) {
                      continue;
                    }

                    $isUpdated[] = true;
                    $stockItem->setData($attrCode, $value);
                  }
                }

                if (isset($data['inventory']['a2c']['modify_qty']) && !$msiEnabled && $isQtySupported) {
                  $stockItem->setQty($stockItem->getQty() + $data['inventory']['a2c']['modify_qty']);
                }

                if ($stockItem->hasDataChanges()) {
                  $stockRegistry->updateStockItemBySku($product->getSku(), $stockItem);

                  $isUpdated[] = true;
                }
              }
            }

            if (key_exists('product_links', $data) && $data['product_links'] !== null) {
              $productLinkInterfaceFactory = $objectManager->create('\Magento\Catalog\Api\Data\ProductLinkInterfaceFactory');
              $productLinks = [];

              if (!$product instanceof \Magento\Catalog\Api\Data\ProductInterface) {
                $product = $productRepo->getById($data['entity_id'], true, 0, true);
              }

              if (empty($data['product_links'])) {
                $product->setProductLinks([]);
              } else {
                foreach ($data['product_links'] as $linkKey => $productLinkData) {
                  /** @var Magento\Catalog\Api\Data\ProductLinkInterface $productLink */
                  $productLink = $productLinkInterfaceFactory->create();

                  if ($productLinkData['sku']) {
                    $sku = $productLinkData['sku'];
                  } else {
                    $sku = $product->getSku();
                  }

                  $productLink->setSku($sku);
                  $productLink->setLinkedProductSku($productLinkData['linked_product_sku']);
                  $productLink->setPosition($linkKey + 1);
                  $productLink->setLinkType($productLinkData['link_type']);
                  $productLinks[] = $productLink;
                }

                $product->setProductLinks($productLinks);
              }

              $isUpdated[] = true;
            }

            if (key_exists('tier_prices', $data) && $data['tier_prices'] !== null) {
              $productTierPricesFactory = $objectManager->create('\Magento\Catalog\Api\Data\ProductTierPriceInterfaceFactory');

              if (!$product instanceof \Magento\Catalog\Api\Data\ProductInterface) {
                $product = $productRepo->getById($data['entity_id'], true, 0, true);
              }

              if (empty($data['tier_prices'])) {
                $product->setTierPrices([]);
              } else {
                $tierPrices = [];

                foreach ($data['tier_prices'] as $tierPriceData) {
                  $tierPrice = $productTierPricesFactory->create();
                  $tierPrice->setCustomerGroupId($tierPriceData['customer_group_id']);
                  $tierPrice->setQty($tierPriceData['qty']);
                  $tierPrice->setValue($tierPriceData['value']);
                  $tierPrices[] = $tierPrice;
                }

                $product->setTierPrices($tierPrices);
              }

              $isUpdated[] = true;
            }

            if (key_exists('images', $data) && $data['images'] !== null) {
              if (!$product instanceof \Magento\Catalog\Api\Data\ProductInterface) {
                $product = $productRepo->getById($data['entity_id'], true, 0, true);
              }

              if (empty($data['images'])) {
                /** @var \Magento\Catalog\Model\ResourceModel\Product\Gallery $imageGalerry */
                $imageGallery = $objectManager->create('\Magento\Catalog\Model\ResourceModel\Product\Gallery');

                $existingImages = $product->getMediaGalleryImages();

                if (!empty($existingImages)) {
                  foreach ($existingImages as $image) {
                    $imageGallery->deleteGallery($image->getValueId());
                  }
                }

                $product->setMediaGalleryEntries([]);
              } else {
                $imageErrors = $this->_addProductGallery($product, $objectManager, $data['images']);

                if (!empty($imageErrors)) {
                  $result[$key]['errors'] = $imageErrors;
                }
              }

              $isUpdated[] = true;
            }

            if (key_exists('super_attributes', $data) && $data['super_attributes'] !== null) {

              /** @var \Magento\Eav\Setup\EavSetup $eavSetup */
              $eavSetup = $objectManager->create('\Magento\Eav\Setup\EavSetup');

              /** @var \Magento\Eav\Model\Config $eavConfig */
              $eavConfig = $objectManager->create('\Magento\Eav\Model\Config');

              /** @var \Magento\Eav\Api\AttributeOptionManagementInterface $attributeOptionManagement */
              $attributeOptionManagement = $objectManager->create('\Magento\Eav\Api\AttributeOptionManagementInterface');

              if (!$product instanceof \Magento\Catalog\Api\Data\ProductInterface) {
                $product = $productRepo->getById($data['entity_id'], true, 0, true);
              }

              $createNewAttrSet = [];
              $productAttributesIds = [];
              $productAttributes    = [];

              foreach ($data['super_attributes'] as $superAttribute) {
                if ($superAttribute['id'] !== null) {
                  $productAttributesIds[] = $superAttribute['id'];
                  $attribute              = $eavConfig->getAttribute(\Magento\Catalog\Model\Product::ENTITY, (int)$superAttribute['id']);

                  if (!empty($superAttribute['options'])) {
                    foreach ($superAttribute['options'] as $label) {
                      if ($attribute->getSource()->getOptionId($label) === null) {
                        /** @var \Magento\Eav\Model\Entity\Attribute\OptionLabel $optionLabel */
                        $optionLabel = $objectManager->create('\Magento\Eav\Model\Entity\Attribute\OptionLabel');
                        $optionLabel->setStoreId(0);
                        $optionLabel->setLabel($label);

                        /** @var \Magento\Eav\Model\Entity\Attribute\Option $option */
                        $option = $objectManager->create('\Magento\Eav\Model\Entity\Attribute\Option');
                        $option->setLabel($optionLabel->getLabel());
                        $option->setStoreLabels([$optionLabel]);
                        $option->setIsDefault(false);

                        $attributeOptionManagement->add(\Magento\Catalog\Model\Product::ENTITY, $attribute->getAttributeId(), $option);
                      }
                    }
                  }

                  $productAttributes[] = $attribute;
                  $createNewAttrSet[] = $superAttribute['create_new_attr_set'];
                } else {
                  $eavSetup->addAttribute(
                    \Magento\Catalog\Model\Product::ENTITY,
                    $superAttribute['code'],
                    [
                      'type'                    => 'int',
                      'backend'                 => '',
                      'frontend'                => '',
                      'label'                   => $superAttribute['attribute'],
                      'input'                   => 'select',
                      'class'                   => '',
                      'source'                  => '\Magento\Eav\Model\Entity\Attribute\Source\Table',
                      'global'                  => \Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface::SCOPE_GLOBAL,
                      'visible'                 => true,
                      'required'                => false,
                      'user_defined'            => true,
                      'default'                 => '',
                      'searchable'              => true,
                      'filterable'              => true,
                      'comparable'              => true,
                      'visible_on_front'        => true,
                      'used_in_product_listing' => true,
                      'unique'                  => false,
                      'apply_to'                => ''
                    ]
                  );

                  $productAttributesIds[] = $eavSetup->getAttribute(\Magento\Catalog\Model\Product::ENTITY, $superAttribute['code'], 'attribute_id');

                  $attribute = $eavConfig->getAttribute(\Magento\Catalog\Model\Product::ENTITY, $superAttribute['code']);
                  $attribute->setFrontendLabels([$superAttribute['attribute']]);
                  $attribute->save();

                  if (!empty($superAttribute['options'])) {
                    foreach ($superAttribute['options'] as $label) {
                      if ($attribute->getSource()->getOptionId($label) === null) {
                        /** @var \Magento\Eav\Model\Entity\Attribute\OptionLabel $optionLabel */
                        $optionLabel = $objectManager->create('\Magento\Eav\Model\Entity\Attribute\OptionLabel');
                        $optionLabel->setStoreId(0);
                        $optionLabel->setLabel($label);

                        /** @var \Magento\Eav\Model\Entity\Attribute\Option $option */
                        $option = $objectManager->create('\Magento\Eav\Model\Entity\Attribute\Option');
                        $option->setLabel($optionLabel->getLabel());
                        $option->setStoreLabels([$optionLabel]);
                        $option->setIsDefault(false);

                        $attributeOptionManagement->add(\Magento\Catalog\Model\Product::ENTITY, $attribute->getAttributeId(), $option);
                      }
                    }
                  }

                  $createNewAttrSet[] = $superAttribute['create_new_attr_set'];
                  $productAttributes[] = $attribute;
                }
              }

              if (array_sum($createNewAttrSet)) {
                /** @var \Magento\Eav\Api\AttributeSetManagementInterface $attributeSetManagement */
                $attributeSetManagement = $objectManager->create('\Magento\Eav\Api\AttributeSetManagementInterface');

                /** @var \Magento\Eav\Model\Entity\Attribute\SetFactory $attributeSetFactory */
                $attributeSetFactory = $objectManager->create('\Magento\Eav\Model\Entity\Attribute\SetFactory');

                $entityTypeId = $eavSetup->getEntityTypeId(\Magento\Catalog\Model\Product::ENTITY);

                /** @var \Magento\Eav\Model\Entity\Attribute\Set $attributeSet */
                $attributeSet = $attributeSetFactory->create();
                $attributeSet->setEntityTypeId($entityTypeId);

                $productAttrSet = $eavSetup->getAttributeSet($entityTypeId, $product->getAttributeSetId());

                if (isset($productAttrSet['attribute_set_name'])) {
                  $attributeSetName = $productAttrSet['attribute_set_name'] . '_' . implode('_', array_column($data['super_attributes'], 'attribute'));
                } else {
                  $attributeSetName = implode('_', array_column($data['super_attributes'], 'attribute'));
                }

                $attributeSet->setAttributeSetName($attributeSetName);
                $clonedAttributeSet = $attributeSetManagement->create(\Magento\Catalog\Model\Product::ENTITY, $attributeSet, $product->getAttributeSetId());

                foreach ($data['super_attributes'] as $superAttribute) {
                  $attributeSetId = $clonedAttributeSet->getAttributeSetId();
                  $attribute = $eavConfig->getAttribute(\Magento\Catalog\Model\Product::ENTITY, $superAttribute['code']);

                  $eavSetup->addAttributeToSet(
                    \Magento\Catalog\Model\Product::ENTITY,
                    $attributeSetId,
                    $eavSetup->getDefaultAttributeGroupId(\Magento\Catalog\Model\Product::ENTITY, $clonedAttributeSet->getAttributeSetId()),
                    $attribute->getAttributeCode()
                  );
                }

                $product->setAttributeSetId($clonedAttributeSet->getAttributeSetId());

                $isUpdated[] = true;
              } else {
                foreach ($data['super_attributes'] as $superAttribute) {
                  if (empty($superAttribute['attribute_in_set'])) {
                    $attribute = $eavConfig->getAttribute(\Magento\Catalog\Model\Product::ENTITY, $superAttribute['code']);
                    $attributeSetId = $product->getAttributeSetId();
                    $eavSetup->addAttributeToSet(
                      \Magento\Catalog\Model\Product::ENTITY,
                      $attributeSetId,
                      $eavSetup->getDefaultAttributeGroupId(\Magento\Catalog\Model\Product::ENTITY, $attributeSetId),
                      $attribute->getAttributeCode()
                    );
                    $attribute->save();

                    $isUpdated[] = true;
                  }
                }
              }

              $configurableAttributes = [];

              if ($product->getTypeId() === 'configurable') {
                $configurableAttributes = $product->getTypeInstance()->getConfigurableAttributesAsArray($product);
                $isUpdated[] = true;
              }

              if ($product->getTypeId() !== 'configurable' || empty($configurableAttributes)) {
                $product->setTypeId('configurable');
                $product->getTypeInstance()->setUsedProductAttributes($product, $productAttributesIds);

                $configurableAttributesData = $product->getTypeInstance()->getConfigurableAttributesAsArray($product);
                $configurableProductOptions = $product->getExtensionAttributes()->getConfigurableProductOptions();

                if (empty($configurableProductOptions)) {
                  $productOptions = [];

                  foreach ($productAttributes as $attribute) {
                    /** @var \Magento\ConfigurableProduct\Api\Data\OptionInterface $option */
                    $option = $objectManager->create('\Magento\ConfigurableProduct\Api\Data\OptionInterface');
                    $option->setAttributeId($attribute->getId());
                    $option->setLabel($attribute->getDefaultFrontendLabel());

                    /** @var \Magento\ConfigurableProduct\Api\Data\OptionValueInterface[] $attributeOptions */
                    $attributeOptions = $attribute->getOptions();

                    foreach ($attributeOptions as $index => $attributeOption) {
                      if ($attributeOption->getValueIndex() === null) {
                        $attributeOption->setValueIndex($index);
                      }
                    }

                    $option->setValues($attributeOptions);


                    $productOptions[] = $option;
                  }

                  $product->getExtensionAttributes()->setConfigurableProductOptions($productOptions);
                }

                $product->setCanSaveConfigurableAttributes(true);
                $product->setConfigurableAttributesData($configurableAttributesData);

                $isUpdated[] = true;
              }
            }

            if (key_exists('super_links', $data) && $data['super_links'] !== null) {

              if (!$product instanceof \Magento\Catalog\Api\Data\ProductInterface) {
                $product = $productRepo->getById($data['entity_id'], true, 0, true);
              }

              $existLinkedProducts = $product->getExtensionAttributes()->getConfigurableProductLinks();

              if (!empty($existLinkedProducts)) {
                $product->getExtensionAttributes()->setConfigurableProductLinks(array_merge($existLinkedProducts, $data['super_links']));
              } else {
                $product->getExtensionAttributes()->setConfigurableProductLinks($data['super_links']);
              }

              $isUpdated[] = true;
            }

            if (array_sum($isUpdated)) {
              $storeManager->setCurrentStore('admin');
              $productRepo->save($product);

              $product->cleanCache();

              /**
               * @var Magento\Framework\Event\ManagerInterface $eventManager
               */
              $eventManager = $objectManager->get('Magento\Framework\Event\ManagerInterface');
              $eventManager->dispatch('clean_cache_by_tags', array('object' => $product));
              $result[$key]['is_updated'] = true;

              if ((!key_exists('categories', $data) || (key_exists('categories', $data) && $data['categories'] === null))
                && empty($data['inventory']['sourceItem'])
              ) {
                break;
              }
            }

            if (key_exists('categories', $data) && $data['categories'] !== null) {
              if (!$product instanceof \Magento\Catalog\Api\Data\ProductInterface) {
                $product = $productRepo->getById($data['entity_id'], true, 0, true);
              }

              /** @var \Magento\Catalog\Api\CategoryLinkManagementInterface $categoryLinkManagement */
              $categoryLinkManagement = $objectManager->create('\Magento\Catalog\Api\CategoryLinkManagementInterface');

              if (empty($data['categories'])) {
                /** @var \Magento\Catalog\Api\CategoryLinkRepositoryInterface $getCategoryLinkRepository */
                $getCategoryLinkRepository = $objectManager->create('\Magento\Catalog\Api\CategoryLinkRepositoryInterface');

                foreach ($product->getCategoryIds() as $categoryId) {
                  $getCategoryLinkRepository->deleteByIds($categoryId, $product->getSku());
                }

                /** @var \Magento\Framework\Indexer\IndexerRegistry $productCategoryIndexer */
                $productCategoryIndexerRegistry = $objectManager->create('\Magento\Framework\Indexer\IndexerRegistry');
                $productCategoryIndexer = $productCategoryIndexerRegistry->get(Magento\Catalog\Model\Indexer\Product\Category::INDEXER_ID);

                if (!$productCategoryIndexer->isScheduled()) {
                  $productCategoryIndexer->reindexRow($product->getId());
                }
              } else {
                $categoryLinkManagement->assignProductToCategories($product->getSku(), $data['categories']);
              }

              $result[$key]['is_updated'] = true;

              if (empty($data['inventory']['sourceItem'])) {
                break;
              }

              $isUpdated[] = true;
            }

            if (isset($data['inventory']['sourceItem'])) {
              $isQtySupported = isset($isQtySupportedArr[$product->getTypeId()]) && $isQtySupportedArr[$product->getTypeId()];

              if ($msiEnabled && $isQtySupported) {
                if (!empty($data['inventory']['sourceItem']['assign_to_source'])) {
                  if (!$product instanceof \Magento\Catalog\Api\Data\ProductInterface) {
                    $product = $productRepo->getById($data['entity_id'], true, 0, true);
                  }

                  /** @var \Magento\InventoryApi\Api\Data\SourceItemInterfaceFactory $sourceItemFactory */
                  $sourceItemFactory = $objectManager->create('\Magento\InventoryApi\Api\Data\SourceItemInterfaceFactory');

                  /** @var \Magento\InventoryApi\Api\SourceItemsSaveInterface $sourceItemsSave */
                  $sourceItemsSave = $objectManager->create('\Magento\InventoryApi\Api\SourceItemsSaveInterface');

                  $sourceItem = $sourceItemFactory->create();
                  $sourceItem->setSku($product->getSku());
                  $sourceItem->setQuantity(0);

                  if (isset($data['inventory']['sourceItem']['source_code'])) {
                    $sourceItem->setSourceCode($data['inventory']['sourceItem']['source_code']);
                  } else {
                    $sourceItem->setSourceCode('default');
                  }

                  if (isset($data['inventory']['sourceItem']['status'])) {
                    $sourceItem->setStatus($data['inventory']['sourceItem']['status']);
                  } else {
                    $sourceItem->setStatus('0');
                  }

                  if (isset($data['inventory']['sourceItem']['quantity'])) {
                    $sourceItem->setQuantity(number_format($data['inventory']['sourceItem']['quantity'], 4, '.', ''));
                  }

                  if (isset($data['inventory']['a2c']['modify_qty'])) {
                    $sourceItem->setQuantity(
                      number_format($sourceItem->getQuantity() + $data['inventory']['a2c']['modify_qty'], 4, '.', '')
                    );
                  }

                  $sourceItemsSave->execute([$sourceItem]);

                  $result[$key]['is_updated'] = true;
                } elseif ($this->_msiUpdateStock($data, $product, $objectManager, $store)) {
                  /**
                   * @var Magento\CatalogInventory\Model\StockRegistryStorage $storage
                   */
                  $storage = $objectManager->get('Magento\CatalogInventory\Model\StockRegistryStorage');
                  $storage->clean();

                  $result[$key]['is_updated'] = true;
                }
              }

              break;
            }

            break;
          } catch (Exception $e) {
            if (preg_match('/deadlock/', $e->getMessage())) {
              usleep(rand(1000000, 3000000));
            } else {
              $message = $e->getMessage();
              $errorKey = md5($message);
              $result[$key]['errors'][$errorKey] = ['message' => $message];

              break;
            }
          }
        } while (++ $attempt < 3);

        if (isset($e)) {
          $message = $e->getMessage();
          $errorKey = md5($message);
          $result[$key]['errors'][$errorKey] = ['code' => $e->getCode(), 'message' => $message];
        }
      }

      return $result;
    } else {
      throw new Exception('Action is not supported');
    }
  }

  /**
   * @param Magento\Framework\ObjectManagerInterface $objectManager
   * @param Magento\Catalog\Model\ProductRepository $productRepo
   * @param int $id
   * @param int $storeId
   * @param array $attributeCodes
   * @return Magento\Catalog\Model\Product
   *
   */
  private function _getProduct($objectManager, $productRepo, $id, $storeId, $attributeCodes)
  {
    /**
     * @var Magento\Catalog\Model\Attribute\ScopeOverriddenValue $scopeOverriddenVal
     * @var Magento\Catalog\Model\ProductRepository $productRepo
     * @var Magento\Catalog\Model\Product $product
     * @var Magento\Catalog\Model\ResourceModel\Eav\Attribute\Interceptor $attribute
     * @var Magento\Catalog\Controller\Adminhtml\Product\Initialization\Helper\AttributeFilter $attributeFilter
     */

    $attributeFilter = $objectManager->get('Magento\Catalog\Controller\Adminhtml\Product\Initialization\Helper\AttributeFilter');
    $scopeOverriddenVal = $objectManager->get('Magento\Catalog\Model\Attribute\ScopeOverriddenValue');
    $product = $productRepo->getById($id, true, (string)$storeId, true);
    $attributes = $product->getAttributes();
    $useDefaults = array();

    $newData['current_store_id'] = (string)$storeId;
    $newData['current_product_id'] = (string)$id;

    foreach ($attributes as $attributeCode => $attribute) {
      if ($attribute->isStatic() || $attribute->isScopeGlobal() || in_array($attributeCode, $attributeCodes)) {
        continue;
      }

      $useDefaults[$attributeCode] = $scopeOverriddenVal->containsValue(
        'Magento\Catalog\Api\Data\ProductInterface',
        $product,
        $attributeCode,
        \Magento\Store\Model\Store::DEFAULT_STORE_ID
      ) ? '1' : '0';
    }

    $productData = $attributeFilter->prepareProductAttributes($product, $product->getData(), $useDefaults);
    $product->addData($productData);

    return $product;
  }

  /**
   * @param mixed $current Current value
   * @param mixed $new     New Value
   *
   * @return bool
   */
  private function _isValuesEqual($current, $new)
  {
    switch (gettype($new)) {
      case 'integer': $current = (int)$current; break;
      case 'double': $current = (float)$current; break;
      case 'float': $current = (float)$current; break;
      case 'string': $current = (string)$current; break;
      case 'boolean': $current = (string)$current; break;
    };

    return $current === $new;
  }

  /**
   * @param array $data Data
   *
   * @return int
   * @throws \Magento\Framework\Exception\CouldNotSaveException
   * @throws \Magento\Framework\Exception\InputException
   * @throws \Magento\Framework\Exception\NoSuchEntityException
   * @throws \Magento\Framework\Exception\StateException
   */
  private function _productUpdateMage2($data)
  {
    require M1_STORE_ROOT_DIR . DIRECTORY_SEPARATOR  . 'app' . DIRECTORY_SEPARATOR . 'bootstrap.php';

    $bootstrap = \Magento\Framework\App\Bootstrap::create(M1_STORE_ROOT_DIR, $_SERVER);
    $objectManager = $bootstrap->getObjectManager();
    $state = $objectManager->get('Magento\Framework\App\State');
    $state->setAreaCode('global');

    /**
     * @var Magento\Store\Model\StoreManager $storeManager
     * @var Magento\Catalog\Model\Product $product
     * @var Magento\Catalog\Model\ProductRepository $productRepo
     * @var Magento\Framework\App\Request\DataPersistor $dataPersistor
     * @var Magento\Framework\App\Config $config
     */
    $productRepo = $objectManager->get('Magento\Catalog\Model\ProductRepository');
    $storeManager = $objectManager->get('Magento\Store\Model\StoreManager');
    $store = $storeManager->getStore((string)$data['store_id']);
    $storeManager->setCurrentStore($store->getCode());
    $config = $objectManager->get('Magento\Framework\App\Config\ScopeConfigInterface');
    $isPricesPerWebsite = (int)$config->getValue('catalog/price/scope', Magento\Store\Model\ScopeInterface::SCOPE_WEBSITE) === 1;

    $isUpdated = false;
    $isProductSaved = false;

    if (empty($data['attributes'])) {
      $product = $productRepo->getById($data['entity_id'], false, 0, true);
      $product->validate();
    } else {
      foreach ($data['attributes'] as $storeId => $values) {
        $store = $storeManager->getStore($storeId);
        $storeManager->setCurrentStore($store->getCode());
        if ($storeId === 0) {
          $product = $productRepo->getById($data['entity_id'], true, 0, true);
        } else {
          $product = $this->_getProduct($objectManager, $productRepo, $data['entity_id'], $storeId, array_keys($values));
        }

        $storedData = $product->getStoredData();
        $productData = $product->getStoredData();

        $newData = array();
        foreach ($values as $attrCode => $value) {
          if ($attrCode === 'url_key') {
            $value = $product->getUrlModel()->formatUrlKey($value);
          }

          $attributes = $product->getAttributes();
          $hasAttribute = isset($attributes[$attrCode]);
          $currentValue = isset($productData[$attrCode]) ? $productData[$attrCode] : (isset($storedData[$attrCode]) ? $storedData[$attrCode] : null);

          if ($hasAttribute && !$this->_isValuesEqual($currentValue, $value)) {
            if ($attrCode === 'url_key' && $data['save_rewrites_history']) {
              $newData['url_key_create_redirect'] = $product->getUrlKey();
              $newData['save_rewrites_history']   = true;
            }

            if ($storeId > 0
              && $isPricesPerWebsite
              && $attributes[$attrCode]->getBackendModel() === 'Magento\Catalog\Model\Product\Attribute\Backend\Price'
            ) {
              $this->setPricePerStore($objectManager, $data['entity_id'], $storeId, $attrCode, $value);
              $isUpdated = true;
            } else {
              $newData[$attrCode] = $value;
            }
          }
        }

        if (!empty($newData)) {
          $product->addData($newData);
          $product = $productRepo->save($product);
          $dataPersistor = $objectManager->get('\Magento\Framework\App\Request\DataPersistor');
          $dataPersistor->clear('catalog_product');

          $isUpdated = true;
          $isProductSaved = true;
        }
      }
    }

    if (!empty($data['inventory'])) {
      /**
       * @var Magento\CatalogInventory\Model\Configuration $stockConf
       */
      $stockConf = $objectManager->get('Magento\CatalogInventory\Model\Configuration');
      $isQtySupportedArr = $stockConf->getIsQtyTypeIds();
      $isQtySupported = isset($isQtySupportedArr[$product->getTypeId()]) && $isQtySupportedArr[$product->getTypeId()];

      /**
       * @var Magento\Framework\Module\Manager $moduleManager
       */
      $moduleManager = $objectManager->get('Magento\Framework\Module\Manager');
      $msiEnabled = $moduleManager->isEnabled('Magento_Inventory');

      if (isset($data['inventory']['stockItem']) || isset($data['inventory']['a2c'])) {
        /**
         * @var Magento\CatalogInventory\Model\StockRegistry $stockRegistry
         */
        $stockRegistry = $objectManager->get('Magento\CatalogInventory\Model\StockRegistry');
        /**
         * @var Magento\CatalogInventory\Model\Stock\Item $stockItem
         */
        $stockItem = $stockRegistry->getStockItem($data['entity_id'], $store->getWebsiteId());

        if (isset($data['inventory']['stockItem'])) {
          foreach ($data['inventory']['stockItem'] as $attrCode => $value) {
            if ($attrCode === 'qty' && !$isQtySupported
              || $this->_isValuesEqual($stockItem->getData($attrCode), $value)
            ) {
              continue;
            }

            $stockItem->setData($attrCode, $value);
          }
        }

        if (isset($data['inventory']['a2c']['modify_qty']) && !$msiEnabled && $isQtySupported) {
          $stockItem->setQty($stockItem->getQty() + $data['inventory']['a2c']['modify_qty']);
        }

        if ($stockItem->hasDataChanges()) {
          $stockRegistry->updateStockItemBySku($product->getSku(), $stockItem);
          $isUpdated = true;
        }
      }

      if ($msiEnabled && $isQtySupported && $this->_msiUpdateStock($data, $product, $objectManager, $store)) {
        /**
         * @var Magento\CatalogInventory\Model\StockRegistryStorage $storage
         */
        $storage = $objectManager->get('Magento\CatalogInventory\Model\StockRegistryStorage');
        $storage->clean();

        $isUpdated = true;
      }
    }

    if (!empty($data['product_links'])) {
      $productLinkInterfaceFactory = $objectManager->create('\Magento\Catalog\Api\Data\ProductLinkInterfaceFactory');
      $productLinks =[];

      foreach ($data['product_links'] as $key => $productLinkData) {
        /** @var Magento\Catalog\Api\Data\ProductLinkInterface $productLink */
        $productLink = $productLinkInterfaceFactory->create();
        $productLink->setSku($productLinkData['sku']);
        $productLink->setLinkedProductSku($productLinkData['linked_product_sku']);
        $productLink->setPosition($key + 1);
        $productLink->setLinkType($productLinkData['link_type']);
        $productLinks[] = $productLink;
      }

      if (!$product instanceof \Magento\Catalog\Api\Data\ProductInterface) {
        $product = $productRepo->getById($data['entity_id'], true, 0, true);
      }

      $product->setProductLinks($productLinks);

      $productRepo->save($product);
      $isUpdated = true;
    }

    if ($isUpdated) {
      if (!$isProductSaved) {
        $storeManager->setCurrentStore('admin');
        $product = $productRepo->getById($data['entity_id'], true, 0, true);
        $productRepo->save($product);
      }

      $product->cleanCache();

      /**
       * @var Magento\Framework\Event\ManagerInterface $eventManager
       */
      $eventManager = $objectManager->get('Magento\Framework\Event\ManagerInterface');
      $eventManager->dispatch('clean_cache_by_tags', array('object' => $product));
    }

    return (int)$isUpdated;
  }

  /**
   * @param \Magento\Framework\ObjectManagerInterface $objectManager
   * @param int $productId
   * @param int $storeId
   * @param string $code
   * @param float $value
   *
   * @return bool
   */
  protected function setPricePerStore($objectManager, $productId, $storeId, $code, $value)
  {
    /**
     * @var Magento\Catalog\Model\ProductFactory $factory
     * @var Magento\Catalog\Model\ResourceModel\Product $resource
     */
    $factory = $objectManager->get('Magento\Catalog\Model\ProductFactory');
    $resource = $objectManager->get('Magento\Catalog\Model\ResourceModel\Product');
    $product = $factory->create();

    $resource->load($product, $productId);
    $product->setStoreId($storeId);
    $product->setData($code, $value);
    $resource->saveAttribute($product, $code);
  }

  /**
   * @param array $data
   * @param \Magento\Catalog\Model\Product $product
   * @param \Magento\Framework\ObjectManagerInterface $objectManager
   * @param \Magento\Store\Model\Store\Interceptor $store
   */
  private function _msiUpdateStock($data, $product, $objectManager, $store)
  {
    $isInventoryUpdated = false;

    if (isset($data['inventory']['sourceItem'])) {
      /**
       * @var \Magento\Framework\Api\SearchCriteriaBuilderFactory $searchCriteriaBuilderFactory
       */
      $searchCriteriaBuilderFactory = $objectManager->get('\Magento\Framework\Api\SearchCriteriaBuilderFactory');
      $searchCriteriaBuilder = $searchCriteriaBuilderFactory->create();
      $searchCriteriaBuilder->addFilter(
        \Magento\InventoryApi\Api\Data\SourceItemInterface::SKU,
        $product->getSku()
      );

      $searchCriteriaBuilder->addFilter(
        \Magento\InventoryApi\Api\Data\SourceItemInterface::SOURCE_CODE,
        $data['inventory']['sourceItem']['source_code']
      );

      /**
       * @var \Magento\Inventory\Model\SourceItemRepository $sourceItemRepo
       */
      $sourceItemRepo = $objectManager->get('\Magento\Inventory\Model\SourceItemRepository');
      $sourceItems = $sourceItemRepo->getList($searchCriteriaBuilder->create())->getItems();

      if (!empty($sourceItems)) {
        /**
         * @var \Magento\Inventory\Model\SourceItem $sourceItem
         */
        foreach ($sourceItems as $sourceItem) {
          $isSourceItemUpdated = false;

          foreach ($data['inventory']['sourceItem'] as $attrCode => $value) {
            if (!$this->_isValuesEqual($sourceItem->getDataByKey($attrCode), $value)) {
              $sourceItem->setData($attrCode, $value);
              $isSourceItemUpdated = true;
            }
          }

          if (isset($data['inventory']['a2c']['modify_qty'])) {
            $sourceItem->setData(
              'quantity',
              number_format($sourceItem->getQuantity() + $data['inventory']['a2c']['modify_qty'], 4, '.', '')
            );

            $isSourceItemUpdated = true;
          }

          if ($isSourceItemUpdated) {
            /**
             * @var \Magento\Inventory\Model\SourceItem\Command\SourceItemsSave $sourceItemSave
             */
            $sourceItemSave = $objectManager->get('\Magento\Inventory\Model\SourceItem\Command\SourceItemsSave');
            $sourceItemSave->execute($sourceItems);

            $isInventoryUpdated = true;
          }
        }

        if (isset($data['inventory']['a2c']['reserve_qty'])) {
          /**
           * @var \Magento\InventorySales\Model\StockResolver $stockResolver
           */
          $stockResolver = $objectManager->get('\Magento\InventorySales\Model\StockResolver');
          $stockId = (int)$stockResolver->execute(
            \Magento\InventorySalesApi\Api\Data\SalesChannelInterface::TYPE_WEBSITE,
            $store->getWebsite()->getCode()
          )->getStockId();

          /**
           * @var \Magento\InventoryReservations\Model\ReservationBuilder $reservationBuilder
           */
          $reservationBuilder = $objectManager->get('\Magento\InventoryReservations\Model\ReservationBuilder');
          $reservationBuilder->setQuantity($data['inventory']['a2c']['reserve_qty']);
          $reservationBuilder->setSku($product->getSku());
          $reservationBuilder->setStockId($stockId);

          $reservation = $reservationBuilder->build();

          /**
           * @var \Magento\InventoryReservations\Model\AppendReservations $appendReservation
           */
          $appendReservation = $objectManager->get('\Magento\InventoryReservations\Model\AppendReservations');
          $appendReservation->execute(array($reservation));

          $isInventoryUpdated = true;
        }
      }
    }

    return $isInventoryUpdated;
  }

  /**
   * @param \Magento\Catalog\Model\Product            $product       Product Model
   * @param \Magento\Framework\ObjectManagerInterface $objectManager Object Manager
   * @param array                                     $images        Images Data
   *
   * @return array
   */
  protected function _addProductGallery(\Magento\Catalog\Model\Product $product, \Magento\Framework\ObjectManagerInterface $objectManager, $images)
  {
    $errors = [];
    $fileUploader = new M1_Bridge_Action_Savefile();
    @$fileUploader->cartType = $this->cartType;
    $galleryEntries    = [];
    $existingImages    = $product->getMediaGalleryEntries();
    $existingImagesMap = [];

    if ($existingImages !== null) {
      foreach ($existingImages as $existingImage) {
        $existingImagesMap[$existingImage->getId()] = $existingImage;
      }
    }

    $mediaGalleryEntryFactory = $objectManager->create(
      'Magento\Catalog\Api\Data\ProductAttributeMediaGalleryEntryInterfaceFactory'
    );

    foreach ($images as $imgKey => $imageData) {
      if (isset($imageData['id']) && isset($existingImagesMap[$imageData['id']])) {
        $galleryEntries[] = $existingImagesMap[$imageData['id']]->setPosition($imgKey);
      } else {
        try {
          $res = $fileUploader->_saveFile($imageData['source'], $imageData['target'], 0, 0);
        } catch (Exception $e) {
          $errors[] = [
            'message' => 'Image was not saved. Please check permission, space on a disk, image availability or firewall settings.'
          ];

          continue;
        }

        if ($res === 'OK') {
          /** @var \Magento\Catalog\Api\Data\ProductAttributeMediaGalleryEntryInterface $imageEntry * */
          $imageEntry = $mediaGalleryEntryFactory->create();

          /** @var Magento\Framework\Api\Data\ImageContentInterfaceFactory $imageContentFactory */
          $imageContentFactory = $objectManager->create('Magento\Framework\Api\Data\ImageContentInterfaceFactory');
          $imageContent        = $imageContentFactory->create();
          $imageFile           = file_get_contents(M1_STORE_BASE_DIR . $imageData['target']);
          $imageContent->setBase64EncodedData(base64_encode($imageFile));

          $finfo    = finfo_open(FILEINFO_MIME_TYPE);
          $mimeType = finfo_buffer($finfo, $imageFile);
          finfo_close($finfo);
          $imageContent->setType($mimeType);
          $imageContent->setName(basename($imageData['target']));

          $imageEntry->setFile($imageData['file']);
          $imageEntry->setMediaType('image');
          $imageEntry->setLabel(isset($imageData['label']) ? $imageData['label'] : '');
          $imageEntry->setPosition($imgKey);
          $imageEntry->setContent($imageContent);
          $imageEntry->setDisabled(false);
          $imageEntry->setTypes(isset($imageData['types']) ? array_values($imageData['types']) : null);
          $galleryEntries[] = $imageEntry;
        } else {
          if ($res === '[BRIDGE ERROR] Bad response received from source, HTTP code 404!') {
            $errors[] = [
              'message' => 'The image could not be found at the source URL = \'' . $imageData['source'] . '\'. ' . 'Please check the URL and try again.'
            ];
          } else {
            $errors[] = [
              'message' => 'Image was not saved. Please check permission, space on a disk, image availability or firewall settings.'
            ];
          }
        }
      }
    }

    $product->setMediaGalleryEntries($galleryEntries);

    return $errors;
  }

  /**
   * Generate a unique URL key based on the product name or existing URL key.
   *
   * @param \Magento\Catalog\Model\Product            $product Product
   * @param \Magento\Framework\ObjectManagerInterface $objectManager Object Manager
   *
   * @return string
   */
  protected function _generateUniqueUrlKey(\Magento\Catalog\Model\Product $product, \Magento\Framework\ObjectManagerInterface $objectManager)
  {
    /** @var \Magento\Catalog\Model\ResourceModel\Product\CollectionFactory $collectionFactory */
    $collectionFactory = $objectManager->create('\Magento\Catalog\Model\ResourceModel\Product\CollectionFactory');

    $storeId = $product->getStoreId();
    $urlKey = $product->getUrlKey();

    if (empty($urlKey)) {
      $urlKey = $product->getUrlModel()->formatUrlKey($product->getName());
    }

    $productCollection = $collectionFactory->create()->addAttributeToFilter('url_key', $urlKey);

    if ($storeId !== null) {
      $productCollection->addStoreFilter($storeId);
    }

    $counter = 1;
    $originalUrlKey = $urlKey;

    while ($productCollection->getSize() > 0 && $counter <= 10) {
      $urlKey = $originalUrlKey . '-' . $counter;
      $counter++;

      $productCollection = $collectionFactory->create()->addAttributeToFilter('url_key', $urlKey);

      if ($storeId !== null) {
        $productCollection->addStoreFilter($storeId);
      }
    }

    if ($counter > 10) {
      $urlKey = $originalUrlKey . '-' . time();
    }

    return $urlKey;
  }

  /**
   * @return void
   */
  protected function _magento1()
  {
    /**
     * @var SimpleXMLElement
     */
    $config = simplexml_load_file(M1_STORE_ROOT_DIR . 'app/etc/local.xml');
    $statuses = simplexml_load_file(M1_STORE_ROOT_DIR . 'app/code/core/Mage/Sales/etc/config.xml');

    $version = $statuses->modules->Mage_Sales->version;
    $result  = array();
    if (version_compare($version, '1.4.0.25') < 0) {
      $statuses = $statuses->global->sales->order->statuses;
      foreach ($statuses->children() as $status) {
        $result[$status->getName()] = (string)$status->label;
      }
    }

    if (file_exists(M1_STORE_ROOT_DIR . "app/Mage.php")) {
      $ver = file_get_contents(M1_STORE_ROOT_DIR . "app/Mage.php");
      if (preg_match("/getVersionInfo[^}]+\'major\' *=> *\'(\d+)\'[^}]+\'minor\' *=> *\'(\d+)\'[^}]+\'revision\' *=> *\'(\d+)\'[^}]+\'patch\' *=> *\'(\d+)\'[^}]+}/s", $ver, $match) == 1 ) {
        $mageVersion = $match[1] . '.' . $match[2] . '.' . $match[3] . '.' . $match[4];
        $this->cartVars['dbVersion'] = $mageVersion;
        unset($match);
      }
    }

    $this->cartVars['orderStatus'] = $result;
    $this->cartVars['AdminUrl']    = (string)$config->admin->routers->adminhtml->args->frontName;
    $this->cartVars['dbPrefix']    = (string)$config->global->resources->db->table_prefix;

    $this->setHostPort((string)$config->global->resources->default_setup->connection->host);
    $this->username  = (string)$config->global->resources->default_setup->connection->username;
    $this->dbname    = (string)$config->global->resources->default_setup->connection->dbname;
    $this->password  = (string)$config->global->resources->default_setup->connection->password;
    $this->tblPrefix = (string)$config->global->resources->db->table_prefix;

    $this->imagesDir              = 'media/';
    $this->categoriesImagesDir    = $this->imagesDir . "catalog/category/";
    $this->productsImagesDir      = $this->imagesDir . "catalog/product/";
    $this->manufacturersImagesDir = $this->imagesDir;
    @unlink(M1_STORE_ROOT_DIR . 'app/etc/use_cache.ser');
  }

  /**
   * @return void
   */
  protected function _magento2()
  {
    /**
     * @var array
     */
    $config = @include(M1_STORE_ROOT_DIR . 'app/etc/env.php');

    $db = array();
    foreach ($config['db']['connection'] as $connection) {
      if ($connection['active'] == 1) {
        $db = $connection;
        break;
      }
    }

    if (empty($db)) {
      $db = isset($config['db']['connection']['default'])
        ? $config['db']['connection']['default']
        : die('[ERROR] MySQL Query Error: Can not connect to DB');
    }

    $this->setHostPort((string)$db['host']);
    $this->username  = (string)$db['username'];
    $this->dbname    = (string)$db['dbname'];
    $this->password  = (string)$db['password'];
    $this->tblPrefix = (string)$config['db']['table_prefix'];

    $version = '';
    if (file_exists(M1_STORE_ROOT_DIR . 'composer.json')) {
      $string = file_get_contents(M1_STORE_ROOT_DIR . 'composer.json');
      $json = json_decode($string, true);

      if (isset($json['require']['magento/product-enterprise-edition'])) {
        $version = 'EE.' . $json['require']['magento/product-enterprise-edition'];
      } elseif (isset($json['require']['magento/magento-cloud-metapackage'])) {
        $version = 'EE.' . $json['require']['magento/magento-cloud-metapackage'];
      } elseif (isset($json['require']['magento/product-community-edition'])) {
        $version = $json['require']['magento/product-community-edition'];
      }
    }

    if (!$version || preg_match('/[\^*\-<>=~|]/', $version)) {
      try {
        require M1_STORE_ROOT_DIR . 'app/bootstrap.php';

        $bootstrap = Magento\Framework\App\Bootstrap::create(M1_STORE_ROOT_DIR, $_SERVER);
        $objectManager = $bootstrap->getObjectManager();
        $magentoVersion = $objectManager->get('Magento\Framework\App\ProductMetadataInterface');
        $edition = ($magentoVersion->getEdition() === 'Enterprise' ? 'EE.' : '');
        $version = $edition . $magentoVersion->getVersion();
      } catch(Exception $e) {
        die('ERROR_READING_STORE_CONFIG_FILE');
      }
    }

    if (!$version && file_exists(M1_STORE_ROOT_DIR . 'vendor/magento/framework/AppInterface.php')) {
      @include M1_STORE_ROOT_DIR . 'vendor/magento/framework/AppInterface.php';

      if (defined('\Magento\Framework\AppInterface::VERSION')) {
        $version = \Magento\Framework\AppInterface::VERSION;
      } else {
        $version = '2.0.0';
      }
    }

    $this->cartVars['dbVersion'] = $version;

    if (isset($db['initStatements']) && $db['initStatements'] != '') {
      $dbCharset = str_replace('SET NAMES ', '', $db['initStatements']);
      $dbCharset = str_replace(';', '', $dbCharset);
      $this->cartVars['dbCharset'] = $dbCharset;
    }

    $this->imagesDir              = 'pub/media/';
    $this->categoriesImagesDir    = $this->imagesDir . 'catalog/category/';
    $this->productsImagesDir      = $this->imagesDir . 'catalog/product/';
    $this->manufacturersImagesDir = $this->imagesDir;
  }

  /**
   * @param array $a2cData Data
   *
   * @return array|mixed
   */
  public function orderCalculate($a2cData)
  {
    $response = [
      'error_code' => self::ERROR_CODE_SUCCESS,
      'error'      => null,
      'result'     => [],
    ];

    $reportError = function ($e) use ($response) {
      return $this->_getBridgeError($e, $response, self::ERROR_CODE_INTERNAL_ERROR);
    };

    try {
      require M1_STORE_ROOT_DIR . DIRECTORY_SEPARATOR  . 'app' . DIRECTORY_SEPARATOR . 'bootstrap.php';

      $bootstrap = \Magento\Framework\App\Bootstrap::create(M1_STORE_ROOT_DIR, $_SERVER);
      $objectManager = $bootstrap->getObjectManager();

      $customerRepository = $objectManager->get(\Magento\Customer\Api\CustomerRepositoryInterface::class);
      $quoteFactory = $objectManager->get(\Magento\Quote\Model\QuoteFactory::class);
      $storeManager = $objectManager->get(\Magento\Store\Model\StoreManagerInterface::class);
      $state = $objectManager->get(Magento\Framework\App\State::class);
      $productRepository = $objectManager->get(\Magento\Catalog\Model\ProductRepository::class);
      $scopeConfig = $objectManager->get(\Magento\Framework\App\Config\ScopeConfigInterface::class);
      $attributeRepository = $objectManager->get(\Magento\Eav\Api\AttributeRepositoryInterface::class);
      $ruleFactory = $objectManager->get(Magento\SalesRule\Model\RuleFactory::class);
      $couponFactory = $objectManager->get(Magento\SalesRule\Model\CouponFactory::class);

      $store = $storeManager->getStore((string)$a2cData['store_id']);
      $storeManager->setCurrentStore($store->getCode());
      $websiteId = $store->getWebsiteId();
      $state->setAreaCode('global');
      $taxHelper = $objectManager->get(Magento\Tax\Helper\Data::class);

      try {
        $customer = $customerRepository->get($a2cData['email'], $websiteId);
      } catch (\Magento\Framework\Exception\NoSuchEntityException $e) {
        $customer = null;
      }

      $quote = $quoteFactory->create();
      $quote->setStore($store);

      if ($customer === null) {
        $quote->setCustomerIsGuest(true);
        $quote->setCustomerGroupId(0);
      } else {
        $quote->assignCustomer($customer);
      }

      if (!empty($a2cData['currency'])) {
        $quote->setBaseCurrencyCode($store->getBaseCurrencyCode());
        $store->setCurrentCurrencyCode($a2cData['currency']);
        $quote->setQuoteCurrencyCode($a2cData['currency']);
      }

      foreach ($a2cData['items'] as $product) {
        if (empty($product['data_object'])) {
          $dataObject = null;
        } else {
          $dataObject = new \Magento\Framework\DataObject($product['data_object']);
        }

        try {
          $quote->addProduct($productRepository->getById($product['id']), $dataObject);
        } catch (Magento\Framework\Exception\LocalizedException $e) {
          throw new Exception("Product unavailable. Product data: " . json_encode($product));
        }
      }

      $quote->setCustomerEmail($a2cData['email']);
      $billingAddress = $quote->getBillingAddress()->addData($a2cData['billing']);
      $shippingAddress = $quote->getShippingAddress()->addData($a2cData['shipping']);
      $shippingAddress->setCollectShippingRates(true);
      $shippingAddress->collectShippingRates();
      $billingAddress->setCollectShippingRates(true);
      $billingAddress->collectShippingRates();

      if (!empty($a2cData['coupon'])) {
        $quote->setCouponCode($a2cData['coupon']);
        $shippingAddress->setCouponCode($a2cData['coupon']);
        $billingAddress->setCouponCode($a2cData['coupon']);
      }

      $quote->collectTotals();
      $products = [];
      $shippingRates = [];
      $totalDiscount = abs($shippingAddress->getDiscountAmount());

      if ($totalDiscount == 0) {
        $totalDiscount = abs($billingAddress->getDiscountAmount());

        if ($totalDiscount == 0) {
          $totalDiscount = $quote->getSubtotal() - $quote->getSubtotalWithDiscount();
        }
      }

      $getAttributes = function($data, $item, $type) use ($attributeRepository) {
        $buyRequestData = json_decode($data, true);

        //Data is stored as serialized string
        if (empty($buyRequestData)) {
          $buyRequestData = unserialize($data);
        }

        $product = $item->getProduct();
        $options = [];

        if (!empty($buyRequestData['super_attribute'])) {
          foreach ($buyRequestData['super_attribute'] as $attributeId => $optionId) {
            $attribute = $attributeRepository->get('catalog_product', $attributeId);
            $attributeCode = $attribute->getAttributeCode();
            $options[] = [
              'attribute_id' => $attributeId,
              'label'        => $attribute->getStoreLabel(),
              'value'        => $product->getResource()->getAttribute($attributeCode)->getSource()->getOptionText($optionId),
              'value_id'     => $optionId,
              'price'        => 0,
              'type'         => $attribute->getFrontendInput()
            ];
          }
        }

        if ($type === 'bundle' && !empty($buyRequestData['bundle_option'])) {
          $typeInstance = $product->getTypeInstance();
          $optionsCollection = $typeInstance->getOptionsCollection($product);
          $selectionsCollection = $typeInstance->getSelectionsCollection($optionsCollection->getAllIds(), $product);
          $optionsCollection->appendSelections($selectionsCollection, true);

          foreach ($buyRequestData['bundle_option'] as $optionId => $selectionId) {
            $option = $optionsCollection->getItemById($optionId);

            if (!empty($option)) {
              foreach ($option->getSelections() as $selection) {
                if ($selection->getSelectionId() == $selectionId) {
                  $options[] = [
                    'attribute_id' => $optionId,
                    'label'        => $option->getTitle(),
                    'value'        => $selection->getName(),
                    'value_id'     => $selection->getProductId(),
                    'price'        => 0,
                    'type'         => $option->getType(),
                  ];
                  break;
                }
              }
            }
          }
        }

        if (!empty($buyRequestData['options'])) {
          $productOptions = $product->getOptions();

          if (!empty($productOptions)) {
            foreach ($buyRequestData['options'] as $optionId => $value) {
              foreach ($productOptions as $option) {
                if ($optionId == $option->getOptionId()) {
                  $valueId = null;
                  $optionPrice = 0;

                  if (!empty($optionValues = $option->getValues())) {
                    foreach ($optionValues as $optionValueId => $optionValue) {
                      if ($value == $optionValueId) {
                        $valueId = $optionValueId;
                        $value = $optionValue->getTitle();
                        $optionPrice = $optionValue->getPrice();
                        break;
                      }
                    }
                  }

                  $options[] = [
                    'attribute_id' => $optionId,
                    'label'        => $option->getTitle(),
                    'value'        => $value,
                    'value_id'     => $valueId,
                    'price'        => $optionPrice,
                    'type'         => $option->getType()
                  ];
                  break;
                }
              }
            }
          }
        }

        return $options;
      };

      $getItemData = function($item) use ($getAttributes) {
        $itemTaxes = $item->getAppliedTaxes();
        $itemTaxRate = 0;
        $price = (float)$item->getConvertedPrice();
        $type = $item->getProductType();
        $infoBuyRequest = $item->getOptionByCode('info_buyRequest');
        $options = [];

        if (!empty($itemTaxes)) {
          foreach($itemTaxes as $itemTax) {
            $itemTaxRate += $itemTax['percent'];
          }
        }

        if (!empty($infoBuyRequest)) {
          $options = $getAttributes($infoBuyRequest->getValue(), $item, $type);
        }

        $itemData = [
          'id'             => $item->getProductId(),
          'parent_id'      => null,
          'sku'            => $item->getSku(),
          'name'           => $item->getName(),
          'qty'            => $item->getQty(),
          'price'          => $price,
          'price_incl_tax' => $item->getPriceInclTax(),
          'tax'            => $item->getTaxAmount(),
          'tax_rate'       => $itemTaxRate / 100,
          'discount'       => $item->getDiscountAmount() / $item->getQty(),
          'weight'         => $item->getWeight(),
          'options'        => $options,
          'type'           => $item->getProductType()
        ];

        return $itemData;
      };

      $discounts = [];
      $couponCode = $quote->getCouponCode();
      $couponRule = null;

      if ($couponCode) {
        $couponModel = $couponFactory->create()->loadByCode($couponCode);

        if ($couponModel->getId()) {
          $couponRule = $couponModel->getRuleId();
        }
      }

      $itemsToSkip = [];

      foreach ($quote->getAllVisibleItems() as $item) {
        if ($item->getHasChildren()) {
          $isBundleItem = false;

          if ($item->getProductType() === 'bundle') {
            $products[] = $getItemData($item);
            $quantityMultiplier = $item->getQty();
            $isBundleItem = true;
          } else {
            $quantityMultiplier = 1;
          }

          foreach ($item->getChildren() as $child) {
            $itemsToSkip[] = $child->getProductId();
            $product = $child->getProduct();
            $itemTaxes = $item->getAppliedTaxes();
            $itemTaxRate = 0;
            $stickWithinParent = $product->getStickWithinParent();
            $discount = 0;
            $price = (float)$product->getPrice();
            $discountedPrice = $price;
            $infoBuyRequest = $item->getOptionByCode('info_buyRequest');
            $options = [];
            $type = $child->getProductType();

            if ($isBundleItem) {
              $qty = $child->getQty();
            } else {
              $qty = $product->getQty();
            }

            if (!empty($infoBuyRequest)) {
              $options = $getAttributes($infoBuyRequest->getValue(), $item, $type);
            }

            // ChildItem doesn't have information about prices, so we need to calculate prices based on parent data
            if (!empty($stickWithinParent)) {
              $convertedPrice = $stickWithinParent->getConvertedPrice();
              $parentOriginalPrice = $stickWithinParent->getOriginalPrice();
              $discountAmount = $parentOriginalPrice - $convertedPrice;
              $price = $price * ($convertedPrice / $stickWithinParent->getPrice());

              if ($discountAmount > 0) {
                $discountPercent = $discountAmount / $parentOriginalPrice;
                $discountedPrice = $price * (1 - $discountPercent);
                $discount = $discountedPrice * $discountPercent;
              }
            }

            if (!empty($itemTaxes)) {
              foreach($itemTaxes as $itemTax) {
                $itemTaxRate += $itemTax['percent'];
              }
            }

            if ($itemTaxRate > 0) {
              $unitPriceInclTax = $discountedPrice + ($discountedPrice * $itemTaxRate / 100);
            } else {
              $unitPriceInclTax = $discountedPrice;
            }

            $itemData = [
              'id'             => $child->getProductId(),
              'parent_id'      => $item->getProductId(),
              'sku'            => $product->getSku(),
              'name'           => $product->getName(),
              'qty'            => $qty * $quantityMultiplier,
              'price'          => $discountedPrice,
              'price_incl_tax' => $unitPriceInclTax,
              'tax'            => $unitPriceInclTax - $discountedPrice,
              'tax_rate'       => $itemTaxRate / 100,
              'discount'       => $discount,
              'weight'         => $child->getWeight(),
              'options'        => $options,
              'type'           => $item->getProductType() === 'bundle' ? 'bundle_item' : $type
            ];

            $products[] = $itemData;
          }
        } elseif (!in_array($item->getProductId(), $itemsToSkip)) {
          $products[] = $getItemData($item);
        }

        $extensionAttributes = $item->getExtensionAttributes();

        if (!empty($extensionAttributes)) {
          $appliedDiscounts = $extensionAttributes->getDiscounts();

          if (!empty($appliedDiscounts)
            && round($item->getOriginalPrice() - (float)$item->getConvertedPrice(), 2) > 0
          ) {
            foreach ($appliedDiscounts as $appliedDiscount) {
              $ruleId = $appliedDiscount->getRuleId();
              $rule = $ruleFactory->create()->load($ruleId);
              $discountData = $appliedDiscount->getDiscountData();

              if (empty($discounts[$ruleId])) {
                $discounts[$ruleId] = [
                  'code'            => $couponRule == $ruleId ? $couponCode : $rule->getName(),
                  'amount'          => $discountData->getAmount(),
                  'coupon_discount' => $couponRule == $ruleId,
                  'free_shipping'   => (int)$rule->getSimpleFreeShipping()
                ];
              } else {
                $discounts[$ruleId]['amount'] += $discountData->getAmount();
              }
            }
          }
        }
      }

      $appliedTaxes = [];
      $taxDetails = $shippingAddress->getAppliedTaxes();
      $totalTax = $shippingAddress->getTaxAmount();

      if (empty($taxDetails)) {
        $taxDetails = $billingAddress->getAppliedTaxes();
        $totalTax = $billingAddress->getTaxAmount();
      }

      $appliedTaxesAmount = 0;

      if (!empty($taxDetails)) {
        foreach ($taxDetails as $taxDetail) {
          $appliedTaxes[] = [
            'id'     => $taxDetail['id'],
            'rate'   => (float)$taxDetail['percent'] > 0 ? ((float)$taxDetail['percent'] / 100) : 0,
            'amount' => $taxDetail['amount'],
            'type'   => $taxDetail['item_type'],
          ];
          $appliedTaxesAmount += $taxDetail['amount'];
        }
      }

      if ($totalTax == 0) {
        $totalTax = $appliedTaxesAmount;
      }

      $availRates = $shippingAddress->getAllShippingRates();
      $addressData = $shippingAddress;

      if (empty($availRates)) {
        $availRates = $billingAddress->getAllShippingRates();
        $addressData = $billingAddress;
      }

      if (!empty($availRates)) {
        foreach ($availRates as $shippingRate) {
          $carrierTitle = $shippingRate->getCarrierTitle();

          if (empty($carrierTitle)) {
            continue;
          }

          $priceExclTax = $shippingRate->getPrice();
          $priceInclTax = $taxHelper->getShippingPrice($priceExclTax, true, $addressData);

          if ($priceExclTax > 0) {
            $taxRate = ($priceInclTax / $priceExclTax) - 1;
            $tax = $priceInclTax - $priceExclTax;
          } else {
            $taxRate = 0;
            $tax = 0;
          }

          $shippingRates[] = [
            'code'           => $shippingRate->getCode(),
            'title'          => $carrierTitle . (empty($methodTitle = $shippingRate->getMethodTitle()) ? '' : (' - ' . $methodTitle)),
            'price'          => $priceExclTax,
            'price_incl_tax' => $priceInclTax,
            'tax'            => $tax,
            'rate'           => $taxRate
          ];
        }
      }

      if ($quote->getCustomerId()) {
        $customerPhone = $shippingAddress->getTelephone();

        if (empty($customerPhone)) {
          $customerPhone = $billingAddress->getTelephone();
        }

        $customerData = [
          'id'          => $quote->getCustomerId(),
          'email'       => $quote->getCustomerEmail(),
          'first_name'  => $quote->getCustomerFirstname(),
          'last_name'   => $quote->getCustomerLastname(),
          'phone'       => $customerPhone,
        ];
      } else {
        $customerData = [];
      }

      if (empty($currency = $quote->getQuoteCurrencyCode())) {
        $currency = $store->getCurrentCurrencyCode();
      }

      $response['result'] = [
        'products'           => $products,
        'shipping_rates'     => $shippingRates,
        'currency'           => $currency,
        'customer'           => $customerData,
        'weight_unit'        => $scopeConfig->getValue('general/locale/weight_unit', \Magento\Store\Model\ScopeInterface::SCOPE_STORE),
        'prices_include_tax' => $scopeConfig->getValue('tax/calculation/price_includes_tax', \Magento\Store\Model\ScopeInterface::SCOPE_STORE),
        'taxes'              => $appliedTaxes,
        'subtotal'           => $quote->getSubtotal(),
        'tax'                => $totalTax,
        'discount'           => $totalDiscount,
        'discounts'          => $discounts,
        'applied_coupon'     => !empty($couponRule) && !empty($totalDiscount) ? $couponCode : null
      ];
    } catch (Exception $e) {
      return $reportError($e);
    }

    return $response;
  }

}

/**
 * Class M1_Config_Adapter_JooCart
 */
class M1_Config_Adapter_JooCart extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_JooCart constructor.
   */
  public function __construct()
  {
    require_once M1_STORE_BASE_DIR . "/configuration.php";

    if (class_exists("JConfig")) {

      $jconfig = new JConfig();

      $this->setHostPort($jconfig->host);
      $this->dbname   = $jconfig->db;
      $this->username = $jconfig->user;
      $this->password = $jconfig->password;

    } else {

      $this->setHostPort($mosConfig_host);
      $this->dbname   = $mosConfig_db;
      $this->username = $mosConfig_user;
      $this->password = $mosConfig_password;
    }

    $this->imagesDir              = "components/com_opencart/image/";
    $this->categoriesImagesDir    = $this->imagesDir;
    $this->productsImagesDir      = $this->imagesDir;
    $this->manufacturersImagesDir = $this->imagesDir;
  }

}


/**
 * Class M1_Config_Adapter_Gambio
 */
class M1_Config_Adapter_Gambio extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_Gambio constructor.
   */
  public function __construct()
  {
    $curDir = getcwd();

    chdir(M1_STORE_BASE_DIR);

    @require_once M1_STORE_BASE_DIR . "includes/configure.php";

    chdir($curDir);

    $this->imagesDir = DIR_WS_IMAGES;

    $this->categoriesImagesDir    = $this->imagesDir;
    $this->productsImagesDir      = $this->imagesDir;
    if (defined('DIR_WS_PRODUCT_IMAGES')) {
      $this->productsImagesDir = DIR_WS_PRODUCT_IMAGES;
    }
    if (defined('DIR_WS_ORIGINAL_IMAGES')) {
      $this->productsImagesDir = DIR_WS_ORIGINAL_IMAGES;
    }
    $this->manufacturersImagesDir = $this->imagesDir;

    $this->host      = DB_SERVER;
    //$this->setHostPort(DB_SERVER);
    $this->username  = DB_SERVER_USERNAME;
    $this->password  = DB_SERVER_PASSWORD;
    $this->dbname    = DB_DATABASE;

    chdir(M1_STORE_BASE_DIR);
    if (file_exists(M1_STORE_BASE_DIR  . "includes" . DIRECTORY_SEPARATOR . 'application_top.php')) {
      $conf = file_get_contents (M1_STORE_BASE_DIR . "includes" . DIRECTORY_SEPARATOR . "application_top.php");
      preg_match("/define\('PROJECT_VERSION.*/", $conf, $match);
      if (isset($match[0]) && !empty($match[0])) {
        preg_match("/\d.*/", $match[0], $project);
        if (isset($project[0]) && !empty($project[0])) {
          $version = $project[0];
          $version = str_replace(array(" ","-","_","'",");"), "", $version);
          if ($version != '') {
            $this->cartVars['dbVersion'] = strtolower($version);
          }
        }
      } else {
        //if another oscommerce based cart
        if (file_exists(M1_STORE_BASE_DIR . DIRECTORY_SEPARATOR . 'version_info.php')) {
          @require_once M1_STORE_BASE_DIR . DIRECTORY_SEPARATOR . "version_info.php";
          if (defined('PROJECT_VERSION') && PROJECT_VERSION != '' ) {
            $version = PROJECT_VERSION;
            preg_match("/\d.*/", $version, $vers);
            if (isset($vers[0]) && !empty($vers[0])) {
              $version = $vers[0];
              $version = str_replace(array(" ","-","_"), "", $version);
              if ($version != '') {
                $this->cartVars['dbVersion'] = strtolower($version);
              }
            }
            //if zen_cart
          } else {
            if (defined('PROJECT_VERSION_MAJOR') && PROJECT_VERSION_MAJOR != '' ) {
              $this->cartVars['dbVersion'] = PROJECT_VERSION_MAJOR;
            }
            if (defined('PROJECT_VERSION_MINOR') && PROJECT_VERSION_MINOR != '' ) {
              $this->cartVars['dbVersion'] .= '.' . PROJECT_VERSION_MINOR;
            }
          }
        }
      }
    }

    if (file_exists(M1_STORE_BASE_DIR  . DIRECTORY_SEPARATOR . 'release_info.php')) {
      @include_once M1_STORE_BASE_DIR . DIRECTORY_SEPARATOR . "release_info.php";
      $this->cartVars['dbVersion'] = mb_substr($gx_version, 1);
    }
      chdir($curDir);
  }

}



/**
 * Class M1_Config_Adapter_Cubecart3
 */
class M1_Config_Adapter_Cubecart3 extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_Cubecart3 constructor.
   */
  public function __construct()
  {
    include_once(M1_STORE_BASE_DIR . 'includes/global.inc.php');

    $this->setHostPort($glob['dbhost']);
    $this->dbname    = $glob['dbdatabase'];
    $this->username  = $glob['dbusername'];
    $this->password  = $glob['dbpassword'];
    $this->tblPrefix = $glob['dbprefix'];

    $this->imagesDir = 'images/uploads';
    $this->categoriesImagesDir    = $this->imagesDir;
    $this->productsImagesDir      = $this->imagesDir;
    $this->manufacturersImagesDir = $this->imagesDir;
  }
}

/**
 * Class M1_Config_Adapter_Cubecart
 */
class M1_Config_Adapter_Cubecart extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_Cubecart constructor.
   */
  public function __construct()
  {
    include_once(M1_STORE_BASE_DIR . 'includes/global.inc.php');

    $this->setHostPort($glob['dbhost']);
    $this->dbname    = $glob['dbdatabase'];
    $this->username  = $glob['dbusername'];
    $this->password  = $glob['dbpassword'];
    $this->tblPrefix = $glob['dbprefix'];

    $this->imagesDir = 'images';
    $this->categoriesImagesDir    = $this->imagesDir;
    $this->productsImagesDir      = $this->imagesDir;
    $this->manufacturersImagesDir = $this->imagesDir;
    $dirHandle = opendir(M1_STORE_BASE_DIR . 'language/');
    //settings for cube 5
    $languages = array();
    while ($dirEntry = readdir($dirHandle)) {
      $info = pathinfo($dirEntry);
      $xmlflag = false;

      if (isset($info['extension'])) {
        $xmlflag = strtoupper($info['extension']) != "XML" ? true : false;
      }
      if (is_dir(M1_STORE_BASE_DIR . 'language/' . $dirEntry) || $dirEntry == '.' || $dirEntry == '..' || strpos($dirEntry, "_") !== false || $xmlflag) {
        continue;
      }
      $configXml = simplexml_load_file(M1_STORE_BASE_DIR . 'language/'.$dirEntry);
      if ($configXml->info->title) {
        $lang['name'] = (string)$configXml->info->title;
        $lang['code'] = substr((string)$configXml->info->code, 0, 2);
        $lang['locale'] = substr((string)$configXml->info->code, 0, 2);
        $lang['currency'] = (string)$configXml->info->default_currency;
        $lang['fileName'] = str_replace(".xml", "", $dirEntry);
        $languages[] = $lang;
      }
    }
    if (!empty($languages)) {
      $this->cartVars['languages'] = $languages;
    }

    $conf = false;
    if (file_exists(M1_STORE_BASE_DIR  . 'ini.inc.php')) {
      $conf = file_get_contents (M1_STORE_BASE_DIR . 'ini.inc.php');
    } elseif (file_exists(M1_STORE_BASE_DIR . "includes" . DIRECTORY_SEPARATOR . 'ini.inc.php')) {
      $conf = file_get_contents (M1_STORE_BASE_DIR . "includes" . DIRECTORY_SEPARATOR . 'ini.inc.php');
    }

    if ($conf !== false) {
      preg_match('/\$ini\[[\'"]ver[\'"]\]\s*=\s*[\'"](.*?)[\'"]\s*;/', $conf, $match);
      if (isset($match[1]) && !empty($match[1])) {
        $this->cartVars['dbVersion'] = strtolower($match[1]);
      } else {
        preg_match("/define\(['\"]CC_VERSION['\"]\s*,\s*['\"](.*?)['\"]\)/", $conf, $match);
        if (isset($match[1]) && !empty($match[1])) {
          $this->cartVars['dbVersion'] = strtolower($match[1]);
        }
      }
    }
  }
}

/**
 * Class M1_Config_Adapter_Cscart203
 */
class M1_Config_Adapter_Cscart203 extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_Cscart203 constructor.
   */
  public function __construct()
  {
    define("IN_CSCART", 1);
    define("CSCART_DIR", M1_STORE_BASE_DIR);
    define("AREA", 1);
    define("DIR_ROOT", M1_STORE_BASE_DIR);
    define("DIR_CSCART", M1_STORE_BASE_DIR);
    define('DS', DIRECTORY_SEPARATOR);
    define('BOOTSTRAP', '');
    require_once M1_STORE_BASE_DIR . 'config.php';
    defined('DIR_IMAGES') or define('DIR_IMAGES', DIR_ROOT . '/images/');

    //For CS CART 1.3.x
    if (isset($db_host) && isset($db_name) && isset($db_user) && isset($db_password)) {
      $this->setHostPort($db_host);
      $this->dbname = $db_name;
      $this->username = $db_user;
      $this->password = $db_password;
      $this->imagesDir = str_replace(M1_STORE_BASE_DIR, '', IMAGES_STORAGE_DIR);
      $this->tblPrefix = 'cscart_';
    } else {

      $this->setHostPort($config['db_host']);
      $this->dbname = $config['db_name'];
      $this->username = $config['db_user'];
      $this->password = $config['db_password'];
      $this->imagesDir = str_replace(M1_STORE_BASE_DIR, '', DIR_IMAGES);

      if (isset($config['table_prefix'])) {
        $this->tblPrefix = $config['table_prefix'];
      } elseif (defined('TABLE_PREFIX')) {
        $this->tblPrefix = TABLE_PREFIX;
      } else {
        $this->tblPrefix = '';
      }
    }

    $this->categoriesImagesDir    = $this->imagesDir;
    $this->productsImagesDir      = $this->imagesDir;
    $this->manufacturersImagesDir = $this->imagesDir;

    if (defined('MAX_FILES_IN_DIR')) {
      $this->cartVars['cs_max_files_in_dir'] = MAX_FILES_IN_DIR;
    }

    if (defined('PRODUCT_VERSION')) {
      $this->cartVars['dbVersion'] = PRODUCT_VERSION;
    }
  }

}


/**
 * Class M1_Config_Adapter_AceShop
 */
class M1_Config_Adapter_AceShop extends M1_Config_Adapter
{

  /**
   * M1_Config_Adapter_AceShop constructor.
   */
  public function __construct()
  {
    require_once M1_STORE_BASE_DIR . "/configuration.php";

    if (class_exists("JConfig")) {

      $jconfig = new JConfig();

      $this->setHostPort($jconfig->host);
      $this->dbname   = $jconfig->db;
      $this->username = $jconfig->user;
      $this->password = $jconfig->password;

    } else {

      $this->setHostPort($mosConfig_host);
      $this->dbname   = $mosConfig_db;
      $this->username = $mosConfig_user;
      $this->password = $mosConfig_password;
    }

    $this->imagesDir = "components/com_aceshop/opencart/image/";
    $this->categoriesImagesDir    = $this->imagesDir;
    $this->productsImagesDir      = $this->imagesDir;
    $this->manufacturersImagesDir = $this->imagesDir;
  }

}


/**
 * Class M1_Bridge_Action_Update
 */
class M1_Bridge_Action_Update
{
  private $_pathToTmpDir;

  /**
   * M1_Bridge_Action_Update constructor.
   */
  public function __construct()
  {
    $this->_pathToTmpDir = __DIR__ . DIRECTORY_SEPARATOR . "temp_a2c";
  }

  /**
   * @param M1_Bridge $bridge
   */
  public function perform(M1_Bridge $bridge)
  {
    $response = new stdClass();
    $currentBridgeContent = file_get_contents(__FILE__);

    if (!($this->_checkBridgeDirPermission()
      && $this->_checkBridgeFilePermission())
    ) {
      $response->code    = 1;
      $response->message = "Bridge Update couldn't be performed. " .
        "Please change permission for bridge folder to 755, bridge file inside it to 644 and set appropriate owner";
      die(json_encode($response));
    }

    if (($data = $this->_downloadFile()) === false) {
      $response->code = 1;
      $response->message = "Can not download new bridge.";

      die(json_encode($response));
    }

    if ($data->body == '') {
      $response->code = 1;
      $response->message = 'New bridge is empty. Please contact us.';

      die(json_encode($response));
    } elseif (strpos($data->body, '<?php') !== 0) {
      $response->code = 1;
      $response->message = 'Downloaded file is not valid.';

      die(json_encode($response));
    }

    if (!$this->_writeToFile($data)) {
      $response->code = 1;
      $response->message = "Bridge is not updated! Please contact us.";

      if (!$this->_isBridgeOk()) {
        file_put_contents(__FILE__, $currentBridgeContent);
      }

      die(json_encode($response));
    }

    $response->code    = 0;
    $response->message = "Bridge successfully updated to latest version";

    if (!$this->_isBridgeOk()) {
      $response->code = 1;
      $response->message = "Bridge is not updated! Please contact us.";

      file_put_contents(__FILE__, $currentBridgeContent);
    }

    die(json_encode($response));
  }

  /**
   * @param string $uri
   * @param bool   $ignoreSsl
   *
   * @return stdClass
   */
  private function _fetch($uri, $ignoreSsl = false)
  {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $uri);
    curl_setopt($ch, CURLOPT_HEADER, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

    if ($ignoreSsl) {
      curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
      curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
    }

    $response = new stdClass();

    $response->body          = curl_exec($ch);
    $response->httpCode      = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $response->contentType   = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $response->contentLength = curl_getinfo($ch, CURLINFO_CONTENT_LENGTH_DOWNLOAD);

    curl_close($ch);

    return $response;
  }

  /**
   * @return bool
   */
  public function _createTempDir()
  {
    @mkdir($this->_pathToTmpDir, 0755);

    return file_exists($this->_pathToTmpDir);
  }

  /**
   * @return bool
   */
  public function _removeTempDir()
  {
    @unlink($this->_pathToTmpDir . DIRECTORY_SEPARATOR . "bridge.php_a2c");
    @rmdir($this->_pathToTmpDir);
    return !file_exists($this->_pathToTmpDir);
  }

  /**
   * @return bool|stdClass
   */
  private function _downloadFile()
  {
    $file = $this->_fetch(M1_BRIDGE_DOWNLOAD_LINK);
    if ($file->httpCode == 200) {
      return $file;
    }

    return false;
  }

  /**
   * @return bool
   */
  protected function _checkBridgeDirPermission()
  {
    return is_writeable(dirname(__FILE__));
  }

  /**
   * @return bool
   */
  protected function _checkBridgeFilePermission()
  {
    $pathToFile = dirname(__FILE__) . DIRECTORY_SEPARATOR . 'bridge.php';

    return is_writeable($pathToFile);
  }

  private function _isBridgeOk()
  {
    if (function_exists('opcache_invalidate')) {
      opcache_invalidate(__FILE__, true);
    }

    $checkBridge = $this->_fetch(
      $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['SERVER_NAME'] . ':' . $_SERVER['SERVER_PORT'] . $_SERVER['SCRIPT_NAME'],
      true
    );

    return strpos($checkBridge->body, 'BRIDGE INSTALLED.') !== false;
  }

  /**
   * @param $data
   * @return bool
   */
  private function _writeToFile($data)
  {
    if (function_exists("file_put_contents")) {
      $bytes = file_put_contents(__FILE__, $data->body);
      return $bytes == $data->contentLength;
    }

    $handle = @fopen(__FILE__, 'w+');
    $bytes = fwrite($handle, $data->body);
    @fclose($handle);

    return $bytes == $data->contentLength;
  }

}

/**
 * Class M1_Bridge_Action_SetProductStores
 */
class M1_Bridge_Action_SetProductStores
{
  public function perform(M1_Bridge $bridge)
  {
    $response = array('error' => null, 'data' => false);
    switch ($bridge->config->cartType) {
      case 'Magento1212':
        $productId = $_POST['product_id'];
        $websiteIds = explode(',', $_POST['store_ids']);

        try {
          $version = str_replace('EE.', '', $bridge->config->cartVars['dbVersion']);
          if (version_compare($version, '2.0.0', '<')) {
            require M1_STORE_ROOT_DIR . '/app/Mage.php';
            Mage::app();
            Mage::app()->setCurrentStore(Mage_Core_Model_App::ADMIN_STORE_ID); //required

            $product = Mage::getModel('catalog/product')->load($productId);
            $product->setWebsiteIds($websiteIds);
            $product->save();
            $response['data'] = true;
          } else {
            require M1_STORE_ROOT_DIR . '/app/bootstrap.php';
            $bootstrap = Magento\Framework\App\Bootstrap::create(M1_STORE_ROOT_DIR, $_SERVER);
            $objectManager = $bootstrap->getObjectManager();

            $state = $objectManager->get('\Magento\Framework\App\State');
            $state->setAreaCode('frontend'); //required

            $product = $objectManager->create('Magento\Catalog\Model\Product')->load($productId);
            $product->setWebsiteIds($websiteIds);
            $product->save();
            $response['data'] = true;
          }

        } catch (Exception $e) {
          $response['error'] = M1_Bridge::getBridgeError($e, null, null, 'message', 'code', __FILE__);
        }

        break;

      default:
        $response['error']['message'] = 'Action is not supported';
    }

    echo json_encode($response);
  }
}

/**
 * Class M1_Bridge_Action_Send_Notification
 */
class M1_Bridge_Action_Send_Notification
{

  /**
   * @param M1_Bridge $bridge
   */
  public function perform(M1_Bridge $bridge)
  {
    $response = array(
      'error' => false,
      'code' => null,
      'message' => null,
    );

    try {
      switch ($_POST['cartId']) {
        case 'Magento1212' :
          if (!file_exists(M1_STORE_ROOT_DIR . '/app/etc/env.php')) {
            include_once M1_STORE_ROOT_DIR . 'includes/config.php';
            include_once M1_STORE_ROOT_DIR . 'app/bootstrap.php';
            include_once M1_STORE_ROOT_DIR . 'app/Mage.php';
            Mage::init();

          } else {
            include_once M1_STORE_ROOT_DIR . 'app/bootstrap.php';

            $bootstrap = Magento\Framework\App\Bootstrap::create(M1_STORE_ROOT_DIR, $_SERVER);
            $obj = $bootstrap->getObjectManager();

            $state = $obj->get('Magento\Framework\App\State');
          }

          switch ($_POST['data_notification']['method']) {
            case 'order.update':
              if (!file_exists(M1_STORE_ROOT_DIR . '/app/etc/env.php')) {
                if (empty($_POST['data_notification']['invoiceId'])) {
                  $order = Mage::getModel('sales/order')->load($_POST['orderId']);
                  $order->sendOrderUpdateEmail(true, $_POST['data_notification']['comment']);
                  $order->save();
                } else {
                  $invoice = Mage::getModel('sales/order_invoice')->load($_POST['data_notification']['invoiceId']);
                  $invoice->sendEmail();
                  $invoice->save();
                }

                echo json_encode($response);
              } else {
                $state->setAreaCode('frontend');

                if (empty($_POST['data_notification']['invoiceId'])) {
                  $order = $obj->create('Magento\Sales\Model\Order')->load($_POST['orderId']); // this is entity id
                  $obj->create('Magento\Sales\Model\Order\Email\Sender\OrderCommentSender')->send(
                    $order,
                    true,
                    $_POST['data_notification']['comment']
                  );
                } else {
                  $invoice = $obj->create('Magento\Sales\Model\Order\Invoice')->load($_POST['data_notification']['invoiceId']); // this is entity id
                  $obj->create('Magento\Sales\Model\Order\Email\Sender\InvoiceSender')->send($invoice);
                }

                echo json_encode($response);
              }

              break;

            case 'order.shipment.add':
              if (!file_exists(M1_STORE_ROOT_DIR . '/app/etc/env.php')) {
                $shipment = Mage::getModel('sales/order_shipment')
                  ->loadByIncrementId($_POST['data_notification']['shipment_id']);
                $shipment->sendEmail();
                $shipment->save();

                echo json_encode($response);
              } else {
                $state->setAreaCode('global');
                $shipment = $obj->create('Magento\Sales\Model\Order\Shipment')
                  ->loadByIncrementId($_POST['data_notification']['shipment_id']); // this is entity id
                $obj->create('Magento\Sales\Model\Order\Email\Sender\ShipmentSender')
                  ->send($shipment);

                echo json_encode($response);
              }

              break;
          }

          break;

        case 'Prestashop' :
          if (version_compare($bridge->config->cartVars['dbVersion'], '1.6.0', '>=')) {
            define('PS_DIR', M1_STORE_BASE_DIR);

            require_once PS_DIR . '/config/config.inc.php';

            if (file_exists(PS_DIR . '/vendor/autoload.php')) {
              require_once PS_DIR . '/vendor/autoload.php';
            } else {
              require_once PS_DIR . '/config/autoload.php';
            }

            $order = new Order($_POST['orderId']);
            $customer = new Customer((int)$order->id_customer);

            if (isset($_POST['data_notification']['method']) && $_POST['data_notification']['method'] == 'return.update') {
              Mail::Send(
                (int)$order->id_lang,
                'order_return_state',
                $this->_getTranslatedTitle($bridge->config->cartVars['dbVersion'], $order, 'Your order return status has changed'),
                array(
                  '{lastname}'           => $customer->lastname,
                  '{firstname}'          => $customer->firstname,
                  '{id_order_return}'    => $_POST['data_notification']['return_id'],
                  '{state_order_return}' => $_POST['data_notification']['return_state'],
                ),
                $customer->email,
                $customer->firstname . ' ' . $customer->lastname,
                null,
                null,
                null,
                null,
                PS_DIR . '/mails/',
                true,
                (int)$order->id_shop
              );
            } else {
              if (isset($_POST['data_notification']['comment'])) {
                $varsTpl = array(
                  '{lastname}'   => $customer->lastname,
                  '{firstname}'  => $customer->firstname,
                  '{id_order}'   => $order->id,
                  '{order_name}' => $order->getUniqReference(),
                  '{message}'    => $_POST['data_notification']['comment']
                );

                $title = $this->_getTranslatedTitle($bridge->config->cartVars['dbVersion'], $order);
                Mail::Send(
                  (int)$order->id_lang,
                  'order_merchant_comment',
                  $title,
                  $varsTpl,
                  $customer->email,
                  $customer->firstname . ' ' . $customer->lastname,
                  null,
                  null,
                  null,
                  null,
                  PS_DIR . '/mails/',
                  true,
                  (int)$order->id_shop
                );
              }

              if (isset($_POST['data_notification']['order_history_id'])) {
                $history = new OrderHistory((int)Tools::getValue('id_order_history'));
                $history->id = (int)$_POST['data_notification']['order_history_id'];

                if (version_compare($bridge->config->cartVars['dbVersion'], '1.7.0', '>=')) {
                  $result = Db::getInstance()->getRow(
                    '
                  SELECT osl.`template`, c.`lastname`, c.`firstname`, osl.`name` AS osname,
                    c.`email`, os.`module_name`, os.`id_order_state`, os.`pdf_invoice`, os.`pdf_delivery`
                  FROM `' . _DB_PREFIX_ . 'order_history` oh
                    LEFT JOIN `' . _DB_PREFIX_ . 'orders` o
                      ON oh.`id_order` = o.`id_order`
                    LEFT JOIN `' . _DB_PREFIX_ . 'customer` c
                      ON o.`id_customer` = c.`id_customer`
                    LEFT JOIN `' . _DB_PREFIX_ . 'order_state` os
                      ON oh.`id_order_state` = os.`id_order_state`
                    LEFT JOIN `' . _DB_PREFIX_ . 'order_state_lang` osl
                      ON (os.`id_order_state` = osl.`id_order_state` AND osl.`id_lang` = o.`id_lang`)
                  WHERE oh.`id_order_history` = ' . (int)$_POST['data_notification']['order_history_id'] . ' 
                    AND os.`send_email` = 1'
                  );

                  if (isset($result['template']) && Validate::isEmail($result['email'])) {
                    ShopUrl::cacheMainDomainForShop($order->id_shop);

                    $topic = $result['osname'];
                    $carrierUrl = '';
                    if (Validate::isLoadedObject($carrier = new Carrier((int)$order->id_carrier, $order->id_lang))) {
                      $carrierUrl = $carrier->url;
                    }
                    $data = array(
                      '{lastname}'        => $result['lastname'],
                      '{firstname}'       => $result['firstname'],
                      '{id_order}'        => (int)$order->id,
                      '{order_name}'      => $order->getUniqReference(),
                      '{followup}'        => str_replace('@', $order->getWsShippingNumber(), $carrierUrl),
                      '{shipping_number}' => $order->getWsShippingNumber(),
                    );

                    if ($result['module_name']) {
                      $module = Module::getInstanceByName($result['module_name']);
                      if (Validate::isLoadedObject($module) && isset($module->extra_mail_vars) && is_array($module->extra_mail_vars)) {
                        $data = array_merge($data, $module->extra_mail_vars);
                      }
                    }

                    $currency = Currency::getCurrencyInstance((int)$order->id_currency);
                    $currencySign = is_array($currency) ? $currency['sign'] : $currency->sign;

                    $data['{total_paid}'] = $currencySign . (float)$order->total_paid;
                    if (Validate::isLoadedObject($order)) {
                      Mail::Send(
                        (int)$order->id_lang,
                        $result['template'],
                        $topic,
                        $data,
                        $result['email'],
                        $result['firstname'] . ' ' . $result['lastname'],
                        null,
                        null,
                        null,
                        null,
                        _PS_MAIL_DIR_,
                        false,
                        (int)$order->id_shop
                      );
                    }
                  }
                } else {
                  $history->sendEmail($order, array());
                }
              }
            }
            echo json_encode($response);
          }
          break;
        case 'Woocommerce':
          chdir(M1_STORE_BASE_DIR . '/wp-admin');
          require_once M1_STORE_BASE_DIR . '/wp-load.php';

          $msgClasses = $_POST['data_notification']['msg_classes'];
          $callParams = $_POST['data_notification']['msg_params'];
          $storeId = $_POST['data_notification']['store_id'];
          if (function_exists('switch_to_blog')) {
            switch_to_blog($storeId);
          }
          $emails = wc()->mailer()->get_emails();
          foreach ($msgClasses as $msgClass) {
            if (isset($emails[$msgClass])) {
              call_user_func_array(array($emails[$msgClass], 'trigger'), $callParams[$msgClass]);
            }
          }
          echo json_encode($response);
          break;
      }
    } catch (Exception $e) {
      $error = M1_Bridge::getBridgeError($e, null, null, 'message', 'code', __FILE__);
      $response['error'] = true;
      $response['code'] = $error['code'];
      $response['message'] = $error['message'];

      echo json_encode($response);
    }
  }

  protected function _getTranslatedTitle($cartVer, $order, $title = '')
  {
    if ($title == '') {
      $title = 'New message regarding your order';
    }

    if (version_compare($cartVer, '1.7.0', '>=')) {
      $orderLanguage = new Language((int) $order->id_lang);
      return Context::getContext()->getTranslator()->trans(
        $title,
        array(),
        'Emails.Subject',
        $orderLanguage->locale
      );
    } else {
      return Mail::l($title, (int)$order->id_lang);
    }

  }
}

/**
 * Class M1_Bridge_Action_Savefile
 */
class M1_Bridge_Action_Savefile
{
  protected $_imageType = null;
  protected $_mageLoaded = false;

  /**
   * @param $bridge
   */
  public function perform(M1_Bridge $bridge)
  {
    $source      = $_POST['src'];
    $destination = $_POST['dst'];
    $width       = (int)$_POST['width'];
    $height      = (int)$_POST['height'];

    echo $this->_saveFile($source, $destination, $width, $height);
  }

  /**
   * @param $source
   * @param $destination
   * @param $width
   * @param $height
   * @return string
   */
  public function _saveFile($source, $destination, $width, $height)
  {
    $extensions = [
      '3g2',
      '3gp',
      '7z',
      'aac',
      'accdb',
      'accde',
      'accdr',
      'accdt',
      'ace',
      'adt',
      'adts',
      'afa',
      'aif',
      'aifc',
      'aiff',
      'alz',
      'amv',
      'apk',
      'arc',
      'arj',
      'ark',
      'asf',
      'avi',
      'b1',
      'b6z',
      'ba',
      'bh',
      'bmp',
      'cab',
      'car',
      'cda',
      'cdx',
      'cfs',
      'cpt',
      'csv',
      'dar',
      'dd',
      'dgc',
      'dif',
      'dmg',
      'doc',
      'docm',
      'docx',
      'dot',
      'dotx',
      'drc',
      'ear',
      'eml',
      'eps',
      'f4a',
      'f4b',
      'f4p',
      'f4v',
      'flv',
      'gca',
      'genozip',
      'gifv',
      'ha',
      'hki',
      'ice',
      'iso',
      'jar',
      'kgb',
      'lha',
      'lzh',
      'lzx',
      'm2ts',
      'm2v',
      'm4a',
      'm4p',
      'm4v',
      'mid',
      'midi',
      'mkv',
      'mng',
      'mov',
      'mp2',
      'mp3',
      'mp4',
      'mpe',
      'mpeg',
      'mpg',
      'mpv',
      'mts',
      'mxf',
      'nsv',
      'ogg',
      'ogv',
      'pak',
      'partimg',
      'pdf',
      'pea',
      'phar',
      'pim',
      'pit',
      'pot',
      'potm',
      'potx',
      'ppam',
      'pps',
      'ppsm',
      'ppsx',
      'ppt',
      'pptm',
      'pptx',
      'psd',
      'pst',
      'pub',
      'qda',
      'qt',
      'rar',
      'rk',
      'rm',
      'rmvb',
      'roq',
      'rtf',
      's7z',
      'sda',
      'sea',
      'sen',
      'sfx',
      'shk',
      'sit',
      'sitx',
      'sldm',
      'sldx',
      'sqx',
      'svi',
      'tar',
      'bz2',
      'gz',
      'lz',
      'xz',
      'zst',
      'tbz2',
      'tgz',
      'tif',
      'tiff',
      'tlz',
      'tmp',
      'ts',
      'txt',
      'txz',
      'uca',
      'uha',
      'viv',
      'vob',
      'vsd',
      'vsdm',
      'vsdx',
      'vss',
      'vssm',
      'vst',
      'vstm',
      'vstx',
      'war',
      'wav',
      'wbk',
      'webm',
      'wim',
      'wks',
      'wma',
      'wmd',
      'wms',
      'wmv',
      'wmz',
      'wp5',
      'wpd',
      'xar',
      'xla',
      'xlam',
      'xlm',
      'xls',
      'xlsm',
      'xlsx',
      'xlt',
      'xltm',
      'xltx',
      'xp3',
      'xps',
      'yuv',
      'yz1',
      'zip',
      'zipx',
      'zoo',
      'zpaq',
      'zz',
      'png',
      'jpeg',
      'jpg',
      'gif',
      ''
    ];
    preg_match("/\.[\w]+$/", $destination, $fileExtension);
    $fileExtension = isset($fileExtension[0]) ? $fileExtension[0] : '';

    if (!in_array(str_replace('.', '', $fileExtension), $extensions)) {
      die('ERROR_INVALID_FILE_EXTENSION');
    }

    if (!preg_match('/^https?:\/\//i', $source)) {
      $result = $this->_createFile($source, $destination);
    } else {
      $result = $this->_saveFileCurl($source, $destination);
    }

    if ($result != "OK") {
      return $result;
    }

    $destination = M1_STORE_BASE_DIR . $destination;

    if ($width != 0 && $height != 0) {
      $this->_scaled2( $destination, $width, $height );
    }

    if ($this->cartType == "Prestashop11") {
      // convert destination.gif(png) to destination.jpg
      $imageGd = $this->_loadImage($destination);

      if ($imageGd === false) {
        return $result;
      }

      if (!$this->_convert($imageGd, $destination, IMAGETYPE_JPEG, 'jpg')) {
        return "CONVERT FAILED";
      }
    }

    return $result;
  }

  /**
   * @param $filename
   * @param bool $skipJpg
   * @return bool|resource
   */
  private function _loadImage($filename, $skipJpg = true)
  {
    $imageInfo = @getimagesize($filename);
    if ($imageInfo === false) {
      return false;
    }

    $this->_imageType = $imageInfo[2];

    switch ($this->_imageType) {
      case IMAGETYPE_JPEG:
        $image = imagecreatefromjpeg($filename);
        break;
      case IMAGETYPE_GIF:
        $image = imagecreatefromgif($filename);
        break;
      case IMAGETYPE_PNG:
        $image = imagecreatefrompng($filename);
        break;
      default:
        return false;
    }

    if ($skipJpg && ($this->_imageType == IMAGETYPE_JPEG)) {
      return false;
    }

    return $image;
  }

  /**
   * @param $image
   * @param $filename
   * @param int $imageType
   * @param int $compression
   * @return bool
   */
  private function _saveImage($image, $filename, $imageType = IMAGETYPE_JPEG, $compression = 85)
  {
    $result = true;
    if ($imageType == IMAGETYPE_JPEG) {
      $result = imagejpeg($image, $filename, $compression);
    } elseif ($imageType == IMAGETYPE_GIF) {
      $result = imagegif($image, $filename);
    } elseif ($imageType == IMAGETYPE_PNG) {
      $result = imagepng($image, $filename);
    }

    imagedestroy($image);

    return $result;
  }

  /**
   * @param $source
   * @param $destination
   * @return string
   */
  private function _createFile($source, $destination)
  {
    if ($this->_createDir(dirname($destination)) !== false) {
      $destination = M1_STORE_BASE_DIR . $destination;
      $body = base64_decode($source);
      if ($body === false || file_put_contents($destination, $body) === false) {
        return '[BRIDGE ERROR] File save failed!';
      }

      return 'OK';
    }

    return '[BRIDGE ERROR] Directory creation failed!';
  }

  /**
   * @param $source
   * @param $destination
   * @return string
   */
  private function _saveFileCurl($source, $destination)
  {
    $source = $this->_escapeSource($source);
    if ($this->_createDir(dirname($destination)) !== false) {
      $destination = M1_STORE_BASE_DIR . $destination;

      $ch = curl_init();
      curl_setopt($ch, CURLOPT_URL, $source);
      curl_setopt($ch, CURLOPT_HEADER, 0);
      curl_setopt($ch, CURLOPT_TIMEOUT, 60);
      curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.1) Gecko/20061204 Firefox/2.0.0.1");
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
      curl_exec($ch);
      $httpResponseCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);

      if ($httpResponseCode != 200) {
         curl_close($ch);
        return "[BRIDGE ERROR] Bad response received from source, HTTP code $httpResponseCode!";
      }

      $dst = @fopen($destination, "wb");
      if ($dst === false) {
        return "[BRIDGE ERROR] Can't create  $destination!";
      }
      curl_setopt($ch, CURLOPT_NOBODY, false);
      curl_setopt($ch, CURLOPT_FILE, $dst);
      curl_setopt($ch, CURLOPT_HTTPGET, true);
      curl_exec($ch);
      if (($error_no = curl_errno($ch)) != CURLE_OK) {
        return "[BRIDGE ERROR] $error_no: " . curl_error($ch);
      }

      curl_close($ch);
      return "OK";

    } else {
      return "[BRIDGE ERROR] Directory creation failed!";
    }
  }

  /**
   * @param $source
   * @return mixed
   */
  private function _escapeSource($source)
  {
    return str_replace(" ", "%20", $source);
  }

  /**
   * @param $dir
   * @return bool
   */
  private function _createDir($dir)
  {
    $dirParts = explode("/", $dir);
    $path = M1_STORE_BASE_DIR;
    foreach ($dirParts as $item) {
      if ($item == '') {
        continue;
      }
      $path .= $item . DIRECTORY_SEPARATOR;
      if (!is_dir($path)) {
        $res = @mkdir($path, 0755);
        if (!$res) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * @param resource $image     - GD image object
   * @param string   $filename  - store sorce pathfile ex. M1_STORE_BASE_DIR . '/img/c/2.gif';
   * @param int      $type      - IMAGETYPE_JPEG, IMAGETYPE_GIF or IMAGETYPE_PNG
   * @param string   $extension - file extension, this use for jpg or jpeg extension in prestashop
   *
   * @return true if success or false if no
   */
  private function _convert($image, $filename, $type = IMAGETYPE_JPEG, $extension = '')
  {
    $end = pathinfo($filename, PATHINFO_EXTENSION);

    if ($extension == '') {
      $extension = image_type_to_extension($type, false);
    }

    if ($end == $extension) {
      return true;
    }

    $width  = imagesx($image);
    $height = imagesy($image);

    $newImage = imagecreatetruecolor($width, $height);

    /* Allow to keep nice look even if resized */
    $white = imagecolorallocate($newImage, 255, 255, 255);
    imagefill($newImage, 0, 0, $white);
    imagecopyresampled($newImage, $image, 0, 0, 0, 0, $width, $height, $width, $height );
    imagecolortransparent($newImage, $white);

    $pathSave = rtrim($filename, $end);

    $pathSave .= $extension;

    return $this->_saveImage($newImage, $pathSave, $type);
  }

  /**
   * scaled2 method optimizet for prestashop
   *
   * @param $destination
   * @param $destWidth
   * @param $destHeight
   * @return string
   */
  private function _scaled2($destination, $destWidth, $destHeight)
  {
    $method = 0;

    $sourceImage = $this->_loadImage($destination, false);

    if ($sourceImage === false) {
      return "IMAGE NOT SUPPORTED";
    }

    $sourceWidth  = imagesx($sourceImage);
    $sourceHeight = imagesy($sourceImage);

    $widthDiff = $destWidth / $sourceWidth;
    $heightDiff = $destHeight / $sourceHeight;

    if ($widthDiff > 1 && $heightDiff > 1) {
      $nextWidth = $sourceWidth;
      $nextHeight = $sourceHeight;
    } else {
      if (intval($method) == 2 || (intval($method) == 0 AND $widthDiff > $heightDiff)) {
        $nextHeight = $destHeight;
        $nextWidth = intval(($sourceWidth * $nextHeight) / $sourceHeight);
        $destWidth = ((intval($method) == 0 ) ? $destWidth : $nextWidth);
      } else {
        $nextWidth = $destWidth;
        $nextHeight = intval($sourceHeight * $destWidth / $sourceWidth);
        $destHeight = (intval($method) == 0 ? $destHeight : $nextHeight);
      }
    }

    $borderWidth = intval(($destWidth - $nextWidth) / 2);
    $borderHeight = intval(($destHeight - $nextHeight) / 2);

    $destImage = imagecreatetruecolor($destWidth, $destHeight);

    $white = imagecolorallocate($destImage, 255, 255, 255);
    imagefill($destImage, 0, 0, $white);

    imagecopyresampled($destImage, $sourceImage, $borderWidth, $borderHeight, 0, 0, $nextWidth, $nextHeight, $sourceWidth, $sourceHeight);
    imagecolortransparent($destImage, $white);

    return $this->_saveImage($destImage, $destination, $this->_imageType, 100) ? "OK" : "CAN'T SCALE IMAGE";
  }
}

/**
 * Class M1_Bridge_Action_ReindexProduct
 */
class M1_Bridge_Action_ReindexProduct
{

  public function perform(M1_Bridge $bridge)
  {
    $response = array('error' => null, 'data' => false);
    switch ($bridge->config->cartType) {
      case 'Magento1212':
        $productIds = $_POST['product_ids'];

        try {
          $version = str_replace('EE.', '', $bridge->config->cartVars['dbVersion']);

          if (version_compare($version, '2.0.0', '<')) {
            require M1_STORE_ROOT_DIR . '/app/Mage.php';

            Mage::app();

            if (is_array($productIds)) {
              foreach ($productIds as $id) {
                $product = Mage::getModel('catalog/product')->load($id);
                $event = Mage::getSingleton('index/indexer')->logEvent(
                  $product,
                  $product->getResource()->getType(),
                  Mage_Index_Model_Event::TYPE_SAVE,
                  false
                );
                $indexCollection = Mage::getModel('index/process')->getCollection();

                foreach ($indexCollection as $index) {
                  $index->setMode(Mage_Index_Model_Process::MODE_REAL_TIME)->processEvent($event);
                }
              }
            } else {
              $product = Mage::getModel('catalog/product')->load($productIds);
              $event = Mage::getSingleton('index/indexer')->logEvent(
                $product,
                $product->getResource()->getType(),
                Mage_Index_Model_Event::TYPE_SAVE,
                false
              );
              $indexCollection = Mage::getModel('index/process')->getCollection();

              foreach ($indexCollection as $index) {
                $index->setMode(Mage_Index_Model_Process::MODE_REAL_TIME)->processEvent($event);
              }
            }
          } else {
            $_SERVER['REQUEST_URI'] = '';
            require M1_STORE_ROOT_DIR . '/app/bootstrap.php';

            $bootstrap = Magento\Framework\App\Bootstrap::create(M1_STORE_ROOT_DIR, $_SERVER);
            $objectManager = $bootstrap->getObjectManager();
            $state = $objectManager->get('\Magento\Framework\App\State');
            $state->setAreaCode('frontend'); //required

            $indexes = array(
              'Magento\CatalogInventory\Model\Indexer\Stock',
              'Magento\Catalog\Model\Indexer\Product\Price',
              'Magento\Catalog\Model\Indexer\Product\Eav',
              'Magento\Catalog\Model\Indexer\Product\Category',
            );

            /**
             * @var \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig
             */
            $scopeConfig = $objectManager->get('\Magento\Framework\App\Config\ScopeConfigInterface');
            if ($scopeConfig->getValue('catalog/frontend/flat_catalog_product', 'default')) {
              $indexes[] = 'Magento\Catalog\Model\Indexer\Product\Flat';
            }

            /**
             * @var Magento\Framework\Indexer\ActionInterface $indexer
             */
            foreach ($indexes as $index) {
              $indexer = $objectManager->create($index);

              if (is_array($productIds)) {
                foreach ($productIds as $id) {
                  $indexer->executeRow($id);
                }
              } else {
                $indexer->executeRow($productIds);
              }
            }

            /** @var \Magento\Framework\Indexer\IndexerRegistry $indexerRegistry */
            $indexerRegistry = $objectManager->get('\Magento\Framework\Indexer\IndexerRegistry');

            if (is_array($productIds)) {
              foreach ($productIds as $id) {
                $indexerRegistry->get(Magento\CatalogSearch\Model\Indexer\Fulltext::INDEXER_ID)->reindexRow($id);
              }
            } else {
              $indexerRegistry->get(Magento\CatalogSearch\Model\Indexer\Fulltext::INDEXER_ID)->reindexRow($productIds);
            }
          }

          $response['data'] = true;

        } catch (Exception $e) {
          $response['error'] = M1_Bridge::getBridgeError($e, null, null, 'message', 'code', __FILE__);
        }

        break;

      default:
        $response['error']['message'] = 'Action is not supported';
    }

    echo json_encode($response);
  }

}

/**
 * Class M1_Bridge_Action_Query
 */
class M1_Bridge_Action_Query
{

  /**
   * Extract extended query params from post and request
   */
  public static function requestToExtParams()
  {
    return array(
      'fetch_fields' => (isset($_POST['fetchFields']) && ($_POST['fetchFields'] == 1)),
      'set_names' => isset($_REQUEST['set_names']) ? $_REQUEST['set_names'] : false
    );
  }

  /**
   * @param M1_Bridge $bridge Bridge Instance
   *
   * @return bool
   */
  public static function setSqlMode(M1_Bridge $bridge)
  {
    if (isset($_REQUEST['sql_settings'])) {
      $sqlSettings = $_REQUEST['sql_settings'];
      $isCryptEnabled = false;

      if (defined('M1_BRIDGE_PUBLIC_KEY') && defined('M1_BRIDGE_ENABLE_ENCRYPTION') && M1_BRIDGE_ENABLE_ENCRYPTION == 1) {
        $isCryptEnabled = true;
      }

      try {
        if (isset($sqlSettings['sql_modes'])) {
          if ($isCryptEnabled) {
            $query = "SET SESSION SQL_MODE=" . decrypt($sqlSettings['sql_modes']);
          } else {
            $query = "SET SESSION SQL_MODE=" . base64_decode(swapLetters($sqlSettings['sql_modes']));
          }

          $bridge->getLink()->localQuery($query);
        }

        if (isset($sqlSettings['sql_variables'])) {
          if ($isCryptEnabled) {
            $query = decrypt($sqlSettings['sql_variables']);
          } else {
            $query = base64_decode(swapLetters($sqlSettings['sql_variables']));
          }

          $bridge->getLink()->localQuery($query);
        }
      } catch (Throwable $exception) {
        $errorMessage = M1_Bridge::getBridgeErrorMessage($exception, __FILE__);
        if ($isCryptEnabled) {
          echo encrypt(
            serialize(
              [
                'error'         => $errorMessage,
                'query'         => $query,
                'failedQueryId' => 0,
              ]
            )
          );
        } else {
          echo base64_encode(
            serialize(
              [
                'error'         => $errorMessage,
                'query'         => $query,
                'failedQueryId' => 0,
              ]
            )
          );
        }

        return false;
      }
    }

    return true;
  }

  /**
   * @param M1_Bridge $bridge Bridge instance
   * @return bool
   */
  public function perform(M1_Bridge $bridge)
  {
    if (isset($_POST['query']) && isset($_POST['fetchMode'])) {
      $isCryptEnabled = false;

      if (defined('M1_BRIDGE_PUBLIC_KEY') && defined('M1_BRIDGE_ENABLE_ENCRYPTION') && M1_BRIDGE_ENABLE_ENCRYPTION == 1) {
        $isCryptEnabled = true;
      }

      if ($isCryptEnabled) {
        $query = decrypt($_POST['query']);
      } else {
        $query = base64_decode(swapLetters($_POST['query']));
      }

      $fetchMode = (int)$_POST['fetchMode'];

      if (!self::setSqlMode($bridge)) {
        return false;
      }

      $res = $bridge->getLink()->query($query, $fetchMode, self::requestToExtParams());

      if (is_array($res['result']) || is_bool($res['result'])) {
        $result = serialize(array(
          'res'           => $res['result'],
          'fetchedFields' => @$res['fetchedFields'],
          'insertId'      => $bridge->getLink()->getLastInsertId(),
          'affectedRows'  => $bridge->getLink()->getAffectedRows(),
        ));

        if ($isCryptEnabled) {
          echo encrypt($result);
        } else {
          echo base64_encode($result);
        }
      } else {
        if ($isCryptEnabled) {
          echo encrypt(serialize(['error' => $res['message'], 'query' => $query, 'failedQueryId' => 0]));
        } else {
          echo base64_encode($res['message']);
        }
      }
    } else {
      return false;
    }
  }
}

class M1_Bridge_Action_Platform_Action
{
  /**
   * @param M1_Bridge $bridge
   */
  public function perform(M1_Bridge $bridge)
  {
    if (isset($_POST['platform_action'], $_POST['data'])
      && $_POST['platform_action']
      && method_exists($bridge->config, $_POST['platform_action'])
    ) {
      $response = array('error' => null, 'data' => null);
      $isCryptEnabled = false;

      if (defined('M1_BRIDGE_PUBLIC_KEY') && defined('M1_BRIDGE_ENABLE_ENCRYPTION') && M1_BRIDGE_ENABLE_ENCRYPTION == 1) {
        $isCryptEnabled = true;
      }

      try {
        if ($isCryptEnabled) {
          $data = json_decode(decrypt($_POST['data']), true);
        } else {
          $data = json_decode(base64_decode(swapLetters($_POST['data'])), true);
        }

        $response['data'] = $bridge->config->{$_POST['platform_action']}($data);
      } catch (Exception $e) {
        $response['error'] = M1_Bridge::getBridgeError($e, null, null, 'message', 'code', __FILE__);
      } catch (Throwable $e) {
        $response['error'] = M1_Bridge::getBridgeError($e, null, null, 'message', 'code', __FILE__);
      }

      echo json_encode($response);
    } else {
      echo json_encode(array('error' => array('message' => 'Action is not supported'), 'data' => null));
    }
  }
}

/**
 * Class M1_Bridge_Action_Phpinfo
 */
class M1_Bridge_Action_Phpinfo
{

  /**
   * @param M1_Bridge $bridge
   */
  public function perform(M1_Bridge $bridge)
  {
    phpinfo();
  }
}


/**
 * Class M1_Bridge_Action_Mysqlver
 */
class M1_Bridge_Action_Mysqlver
{

  /**
   * @param $bridge
   */
  public function perform(M1_Bridge $bridge)
  {
    $message = array();
    preg_match('/^(\d+)\.(\d+)\.(\d+)/', mysql_get_server_info($bridge->getLink()), $message);
    echo sprintf("%d%02d%02d", $message[1], $message[2], $message[3]);
  }
}

class M1_Bridge_Action_Multiquery
{

  protected $_lastInsertIds = array();
  protected $_result        = array();

  /**
   * @param M1_Bridge $bridge Bridge Instance
   * @return bool|null
   */
  public function perform(M1_Bridge $bridge)
  {
    if (isset($_POST['queries']) && isset($_POST['fetchMode'])) {
      @ini_set("memory_limit", "512M");

      $isCryptEnabled = false;

      if (defined('M1_BRIDGE_PUBLIC_KEY') && defined('M1_BRIDGE_ENABLE_ENCRYPTION') && M1_BRIDGE_ENABLE_ENCRYPTION == 1) {
        $isCryptEnabled = true;
      }

      if ($isCryptEnabled) {
        $queries = json_decode(decrypt($_POST['queries']));
      } else {
        $queries = json_decode(base64_decode(swapLetters($_POST['queries'])));
      }

      $count = 0;

      if (!M1_Bridge_Action_Query::setSqlMode($bridge)) {
        return false;
      }

      foreach ($queries as $queryId => $query) {

        if ($count++ > 0) {
          $query = preg_replace_callback('/_A2C_LAST_\{([a-zA-Z0-9_\-]{1,32})\}_INSERT_ID_/', array($this, '_replace'), $query);
          $query = preg_replace_callback('/A2C_USE_FIELD_\{([\w\d\s\-]+)\}_FROM_\{([a-zA-Z0-9_\-]{1,32})\}_QUERY/', array($this, '_replaceWithValues'), $query);
        }

        $res = $bridge->getLink()->query($query, (int)$_POST['fetchMode'], M1_Bridge_Action_Query::requestToExtParams());
        if (is_array($res['result']) || is_bool($res['result'])) {

          $queryRes = array(
            'res'           => $res['result'],
            'fetchedFields' => @$res['fetchedFields'],
            'insertId'      => $bridge->getLink()->getLastInsertId(),
            'affectedRows'  => $bridge->getLink()->getAffectedRows(),
          );

          $this->_result[$queryId] = $queryRes;
          $this->_lastInsertIds[$queryId] = $queryRes['insertId'];

        } else {
          $data['error'] = $res['message'];
          $data['failedQueryId'] = $queryId;
          $data['query'] = $query;

          if ($isCryptEnabled) {
            echo encrypt(serialize($data));
          } else {
            echo base64_encode(serialize($data));
          }

          return false;
        }
      }

      if ($isCryptEnabled) {
        echo encrypt(serialize($this->_result));
      } else {
        echo base64_encode(serialize($this->_result));
      }
    } else {
      return false;
    }
  }

  /**
   * @param array $matches Matches
   *
   * @return int|string
   */
  protected function _replace($matches)
  {
    return $this->_lastInsertIds[$matches[1]];
  }

  /**
   * @param array $matches Matches
   *
   * @return string
   */
  protected function _replaceWithValues($matches)
  {
    $values = array();
    if (isset($this->_result[$matches[2]]['res'])) {
      foreach ($this->_result[$matches[2]]['res'] as $row) {
        if ($row[$matches[1]] === null) {
          $values[] = $row[$matches[1]];
        } else {
          $values[] = addslashes($row[$matches[1]]);
        }
      }
    }

    return '"' . implode('","', array_unique($values)) . '"';
  }

}

/**
 * Class M1_Bridge_Action_m2eExtensionNotify
 */
class M1_Bridge_Action_m2eExtensionNotify
{
  public function perform(M1_Bridge $bridge)
  {
    $response = array('error' => null, 'data' => null);

    try {
      $productId = $_POST['product_id'];

      $version = str_replace('EE.', '', $bridge->config->cartVars['dbVersion']);
      if (version_compare($version, '2.0.0', '<')) {
        require M1_STORE_ROOT_DIR . '/app/Mage.php';
        Mage::app();
        $model = Mage::getModel('M2ePro/PublicServices_Product_SqlChange');
      } else {
        require M1_STORE_ROOT_DIR . '/app/bootstrap.php';
        $bootstrap = Magento\Framework\App\Bootstrap::create(M1_STORE_ROOT_DIR, $_SERVER);
        $objectManager = $bootstrap->getObjectManager();
        $model = $objectManager->create('\Ess\M2ePro\PublicServices\Product\SqlChange');
      }
      $model->markProductChanged($productId);
      $model->applyChanges();
      $response['data'] = 'OK';
    } catch (Exception $e) {
      $response['error'] = M1_Bridge::getBridgeError($e, null, null, 'message', 'code', __FILE__);
    } 

    echo json_encode($response);
  }
}

/**
 * Class M1_Bridge_Action_Getconfig
 */
class M1_Bridge_Action_Getconfig
{

  /**
   * @param $val
   * @return int
   */
  private function parseMemoryLimit($val)
  {
    $valInt = (int)$val;
    $last = strtolower($val[strlen($val)-1]);

    switch($last) {
      case 'g':
        $valInt *= 1024;
      case 'm':
        $valInt *= 1024;
      case 'k':
        $valInt *= 1024;
    }

    return $valInt;
  }

  /**
   * @return mixed
   */
  private function getMemoryLimit()
  {
    $memoryLimit = trim(@ini_get('memory_limit'));
    if (strlen($memoryLimit) === 0) {
      $memoryLimit = "0";
    }
    $memoryLimit = $this->parseMemoryLimit($memoryLimit);

    $maxPostSize = trim(@ini_get('post_max_size'));
    if (strlen($maxPostSize) === 0) {
      $maxPostSize = "0";
    }
    $maxPostSize = $this->parseMemoryLimit($maxPostSize);

    $suhosinMaxPostSize = trim(@ini_get('suhosin.post.max_value_length'));
    if (strlen($suhosinMaxPostSize) === 0) {
      $suhosinMaxPostSize = "0";
    }
    $suhosinMaxPostSize = $this->parseMemoryLimit($suhosinMaxPostSize);

    if ($suhosinMaxPostSize == 0) {
      $suhosinMaxPostSize = $maxPostSize;
    }

    if ($maxPostSize == 0) {
      $suhosinMaxPostSize = $maxPostSize = $memoryLimit;
    }

    return min($suhosinMaxPostSize, $maxPostSize, $memoryLimit);
  }

  /**
   * @return bool
   */
  private function isZlibSupported()
  {
    return function_exists('gzdecode');
  }

  /**
   * @param $bridge
   */
  public function perform(M1_Bridge $bridge)
  {
    try {
      $timeZone = date_default_timezone_get();
    } catch (Exception $e) {
      $timeZone = 'UTC';
    }

    $result = array(
      "images" => array(
        "imagesPath"                => $bridge->config->imagesDir, // path to images folder - relative to store root
        "categoriesImagesPath"      => $bridge->config->categoriesImagesDir,
        "categoriesImagesPaths"     => $bridge->config->categoriesImagesDirs,
        "productsImagesPath"        => $bridge->config->productsImagesDir,
        "productsImagesPaths"       => $bridge->config->productsImagesDirs,
        "manufacturersImagesPath"   => $bridge->config->manufacturersImagesDir,
        "manufacturersImagesPaths"  => $bridge->config->manufacturersImagesDirs,
      ),
      "languages"             => $bridge->config->languages,
      "baseDirFs"             => M1_STORE_BASE_DIR,    // filesystem path to store root
      "bridgeVersion"         => M1_BRIDGE_VERSION,
      "bridgeKeyId"           => defined('M1_BRIDGE_PUBLIC_KEY_ID') ? M1_BRIDGE_PUBLIC_KEY_ID : '',
      "databaseName"          => $bridge->config->dbname,
      "cartDbPrefix"          => $bridge->config->tblPrefix,
      "memoryLimit"           => $this->getMemoryLimit(),
      "zlibSupported"         => $this->isZlibSupported(),
      "cartVars"              => $bridge->config->cartVars,
      "time_zone"             => $bridge->config->timeZone ?: $timeZone
    );

    if (M1_BRIDGE_ENABLE_ENCRYPTION) {
      echo encrypt(serialize($result));
    } else {
      echo serialize($result);
    }
  }

}

/**
 * Class M1_Bridge_Action_Collect_Totals
 */
class M1_Bridge_Action_Get_Url
{

  /**
   * @param M1_Bridge $bridge bridge
   *
   * @return void
   */
  public function perform(M1_Bridge $bridge)
  {
    $responce = array(
      'data' => null,
      'error' => false,
      'code' => null,
      'message' => null,
    );

    try {
      switch ($_POST['cart_id']) {
        case 'Prestashop':
          define ('PS_DIR', M1_STORE_BASE_DIR);
          require_once PS_DIR .'/config/config.inc.php';

          if (file_exists(PS_DIR . '/vendor/autoload.php')) {
            require_once PS_DIR . '/vendor/autoload.php';
          } else {
            require_once PS_DIR . '/config/autoload.php';
          }

          $linkCore = new LinkCore();

          $version = $bridge->config->cartVars['dbVersion'];

          foreach ($_POST['productData'] as $productId => $attribute) {

            if (version_compare($version, '1.7.0', '<')) {
              $attribute = 0;
            }

            $links[$productId] = $linkCore->getProductLink(
              $productId,
              null,
              null,
              null,
              $_POST['langId'],
              $_POST['storeId'],
              $attribute
            );
          }

          $responce['data'] = json_encode($links);

          echo json_encode($responce);
          break;
      }
    } catch (Exception $e) {
      $error = M1_Bridge::getBridgeError($e, null, null, 'message', 'code', __FILE__);
      $responce['error'] = true;
      $responce['code'] = $error['code'];
      $responce['message'] = $error['message'];
      echo json_encode($responce);
    }
  }

}

/**
 * Class M1_Bridge_Action_GetShippingRates
 */
class M1_Bridge_Action_GetShippingRates
{
  public function perform(M1_Bridge $bridge)
  {
    $response = array('error' => null, 'data' => null);
    switch ($bridge->config->cartType) {
      case 'Magento1212':
        $quoteId = $_POST['quote_id'];
        $version = str_replace('EE.', '', $bridge->config->cartVars['dbVersion']);
        if (version_compare($version, '2.0.0', '<')) {
          require M1_STORE_ROOT_DIR . '/app/Mage.php';
          Mage::app();
          $quote = Mage::getModel('sales/quote')->load($quoteId);
        } else {
          require M1_STORE_ROOT_DIR . '/app/bootstrap.php';
          $bootstrap = Magento\Framework\App\Bootstrap::create(M1_STORE_ROOT_DIR, $_SERVER);
          $objectManager = $bootstrap->getObjectManager();

          $state = $objectManager->get('\Magento\Framework\App\State');
          $state->setAreaCode('frontend');

          $quoteRepo = $objectManager->create('\Magento\Quote\Model\QuoteRepository');
          $quote = $quoteRepo->get($quoteId);
        }
        $address = $quote->getShippingAddress();
        $address->setCollectShippingRates(true);
        $rates = $address->collectShippingRates()->getGroupedAllShippingRates();
        foreach ($rates as $carrier) {
          foreach ($carrier as $rate) {
            $response['data'][] = $rate->getData();
          }
        }
        break;

      default:
        $response['error']['message'] = 'Action is not supported';
    }

    echo json_encode($response);
  }
}

/**
 * Class M1_Bridge_Action_GetShipmentProviders
 */
class M1_Bridge_Action_GetShipmentProviders
{

  public function perform(M1_Bridge $bridge)
  {
    $response = array('error' => null, 'data' => null);

    switch ($bridge->config->cartType) {

      case 'Wordpress':

        if ($bridge->config->cartId === 'Woocommerce') {

          if (file_exists(M1_STORE_BASE_DIR . 'wp-content/plugins/woocommerce-shipment-tracking/includes/class-wc-shipment-tracking.php')) {
            try {
              require_once M1_STORE_BASE_DIR . 'wp-load.php';
              require_once M1_STORE_BASE_DIR . 'wp-content/plugins/woocommerce-shipment-tracking/includes/class-wc-shipment-tracking.php';

              $st = new WC_Shipment_Tracking_Actions();
              $res = $st->get_providers();
              $data = array();

              foreach ($res as $country => $providers) {
                foreach ($providers as $providerName => $url) {
                  $data[sanitize_title($providerName)] = array(
                    'name' => $providerName,
                    'country' => $country,
                    'url' => $url
                  );
                }
              }

              $response['data'] = $data;

            } catch (Exception $e) {
              $response['error'] = M1_Bridge::getBridgeError($e, null, null, 'message', 'code', __FILE__);
            }
          } else {
            $response['error']['message'] = 'File does not exist';
          }

        } else {
          $response['error']['message'] = 'Action is not supported';
        }

        break;

      case 'Magento1212':
        try {

          $storeId = isset($_POST['store_id']) ? $_POST['store_id'] : 0;

          $version = str_replace('EE.', '', $bridge->config->cartVars['dbVersion']);
          if (version_compare($version, '2.0.0', '<')) {
            require M1_STORE_ROOT_DIR . '/app/Mage.php';
            Mage::app();
            $carriers = Mage::getSingleton('shipping/config')->getAllCarriers();

          } else {
            require M1_STORE_ROOT_DIR . '/app/bootstrap.php';
            $bootstrap = Magento\Framework\App\Bootstrap::create(M1_STORE_ROOT_DIR, $_SERVER);
            $objectManager = $bootstrap->getObjectManager();

            $state = $objectManager->get('\Magento\Framework\App\State');
            $state->setAreaCode('frontend');

            $carriers = $objectManager->create('Magento\Shipping\Model\Config')->getAllCarriers();
            $scopeConfig = $objectManager->create('\Magento\Framework\App\Config\ScopeConfigInterface');
          }

          $res = array();

          foreach ($carriers as $carrierCode => $carrier) {
            if (version_compare($version, '2.0.0', '<')) {
              $carrierTitle = Mage::getStoreConfig("carriers/$carrierCode/title", $storeId);
              $carrierActive = Mage::getStoreConfig("carriers/$carrierCode/active", $storeId);
            } else {
              $carrierTitle = $scopeConfig->getValue("carriers/$carrierCode/title", \Magento\Store\Model\ScopeInterface::SCOPE_STORE, $storeId);
              $carrierActive = $scopeConfig->getValue("carriers/$carrierCode/active", \Magento\Store\Model\ScopeInterface::SCOPE_STORE, $storeId);
            }

            $methodsData = array();

            try {
              $methods = $carrier->getAllowedMethods();
            } catch (Exception $e) {
              $methods = array();
            }

            foreach ($methods as $methodCode => $method) {
              $code = $carrierCode . '_' . $methodCode;
              $methodsData[] = array('code' => $code, 'title' => $method);
            }

            $res[] = array('methods' => $methodsData, 'code' => $carrierCode, 'title' => $carrierTitle, 'active' => $carrierActive);
          }

          $response['data'] = $res;

        } catch (Exception $e) {
          $response['error'] = M1_Bridge::getBridgeError($e, null, null, 'message', 'code', __FILE__);
        }

        break;

      default:
        $response['error']['message'] = 'Action is not supported';
    }

    echo json_encode($response);
  }

}

/**
 * Class M1_Bridge_Action_GetPaymentModules
 */
class M1_Bridge_Action_GetPaymentModules
{

  public function perform(M1_Bridge $bridge)
  {
    $response = array('error' => null, 'data' => array());

    switch ($bridge->config->cartType) {

      case 'Prestashop':

        try {

          if (version_compare($bridge->config->cartVars['dbVersion'], '1.6.0', '>=')) {

            if (@include_once(M1_STORE_BASE_DIR .'config/config.inc.php')) {

              if (isset($_POST['store_id'])) {
                Shop::setContext(Shop::CONTEXT_SHOP, $_POST['store_id']);
              } else {
                Shop::setContext(Shop::CONTEXT_ALL);
              }

              $modules_list = PaymentModule::getInstalledPaymentModules();

              foreach($modules_list as $module) {
                $response['data'][$module['name']] = array(
                  'display_name' => Module::getModuleName($module['name']),
                  'name' => $module['name']
                );
              }
            }
          }

        } catch (Exception $e) {
          $response['error'] = M1_Bridge::getBridgeError($e, null, null, 'message', 'code', __FILE__);
        }

        break;

      default:
        $response['error']['message'] = 'Action is not supported';
    }

    echo json_encode($response);
  }

}

/**
 * Class M1_Bridge_Action_GetCartWeight
 */
class M1_Bridge_Action_GetCartWeight
{
  public function perform(M1_Bridge $bridge)
  {
    $response = array('error' => null, 'data' => null);
    switch ($bridge->config->cartType) {
      case 'Magento1212':
        $quoteId = $_POST['quote_id'];
        $version = str_replace('EE.', '', $bridge->config->cartVars['dbVersion']);
        if (version_compare($version, '2.0.0', '<')) {
          require M1_STORE_ROOT_DIR . '/app/Mage.php';
          Mage::app();
          $quote = Mage::getModel('sales/quote')->load($quoteId);
        } else {
          require M1_STORE_ROOT_DIR . '/app/bootstrap.php';
          $bootstrap = Magento\Framework\App\Bootstrap::create(M1_STORE_ROOT_DIR, $_SERVER);
          $objectManager = $bootstrap->getObjectManager();

          $state = $objectManager->get('\Magento\Framework\App\State');
          $state->setAreaCode('frontend');

          $quoteRepo = $objectManager->create('\Magento\Quote\Model\QuoteRepository');
          $quote = $quoteRepo->get($quoteId);
        }

        $items = $quote->getAllItems();

        $weight = 0;
        foreach ($items as $item) {
          $weight += ($item->getWeight() * $item->getQty());
        }

        $response['data'] = $weight;

        break;

      default:
        $response['error']['message'] = 'Action is not supported';
    }

    echo json_encode($response);
  }
}

/**
 * Class M1_Bridge_Action_GetAbandonedOrderTotal
 */
class M1_Bridge_Action_GetAbandonedOrderTotal
{

  /**
   * @param M1_Bridge $bridge
   */
  public function perform(M1_Bridge $bridge)
  {

    $response = array('error' => null, 'data' => null);

    try {
      if (!empty($_POST['cartIds']) && $_POST['langId']) {

        include_once M1_STORE_BASE_DIR . '/config/config.inc.php';
        include_once M1_STORE_BASE_DIR . '/init.php';

        foreach ($_POST['cartIds'] as $cartId) {
          $cart     = new Cart($cartId, $_POST['langId']);
          $context  = new Context();
          $currency = new Currency($cart->id_currency);

          $context::getContext()->currency = $currency;

          $response['data'][$cartId] = $cart->getSummaryDetails($_POST['langId'], false);
        }

        echo json_encode($response);
      }
    } catch (Exception $e) {
      $response['error'] = M1_Bridge::getBridgeError($e, null, null, 'message', 'code', __FILE__);

      echo json_encode($response);
    }
  }

}

/**
 * Class M1_Bridge_Action_DispatchCartEvents
 */
class M1_Bridge_Action_DispatchCartEvents
{

  public function perform(M1_Bridge $bridge)
  {
    $response = array('error' => null, 'data' => null);

    try {
      switch ($bridge->config->cartType) {
        case 'Magento1212':

          $events = json_decode($_POST['events'], true);
          if (is_array($events)) {

            $version = str_replace('EE.', '', $bridge->config->cartVars['dbVersion']);
            if (version_compare($version, '2.0.0', '<')) {
              require M1_STORE_ROOT_DIR . '/app/Mage.php';
              Mage::app();
              $mageVersion = 1;
            } else {
              require M1_STORE_ROOT_DIR . '/app/bootstrap.php';
              $bootstrap = Magento\Framework\App\Bootstrap::create(M1_STORE_ROOT_DIR, $_SERVER);
              $objectManager = $bootstrap->getObjectManager();
              $state = $objectManager->get('\Magento\Framework\App\State');
              $state->setAreaCode('frontend');

              $eventManager = $objectManager->create('Magento\Framework\Event\Manager');
              $mageVersion = 2;
            }

            foreach ($events as $eventId => $eventParams) {
              foreach ($eventParams as $paramKey => $paramData) {
                if (isset($paramData['mage_model_name']) && isset($paramData['mage_object_id'])) {
                  if ($mageVersion === 2) {
                    $model = $objectManager->create($paramData['mage_model_name'])->load($paramData['mage_object_id']);
                  } elseif ($mageVersion === 1) {
                    $model = Mage::getModel($paramData['mage_model_name'])->load($paramData['mage_object_id']);
                  } else {
                    $model = null;
                  }
                  $eventParams[$paramKey] = $model;
                } else {
                  $eventParams[$paramKey] = $paramData['data'];
                }
              }

              if ($mageVersion === 2) {
                $eventManager->dispatch($eventId, $eventParams);
              } elseif ($mageVersion === 1) {
                Mage::dispatchEvent($eventId, $eventParams);
              }

            }
            $response['data'] = true;
          } else {
            $response['error']['message'] = 'Invalid action params';
          }

          break;

        default:
          $response['error']['message'] = 'Action is not supported';
      }
    } catch (Exception $e) {
      $response['error'] = M1_Bridge::getBridgeError($e, null, null, 'message', 'code', __FILE__);
    }

    echo json_encode($response);
  }

}

/**
 * Class M1_Bridge_Action_Deleteimages
 */
class M1_Bridge_Action_Deleteimages
{

  /**
   * @param M1_Bridge $bridge
   */
  public function perform(M1_Bridge $bridge)
  {
    switch($bridge->config->cartType) {
      case "Pinnacle361":
        $this->_pinnacleDeleteImages($bridge);
        break;
      case "Prestashop11":
        $this->_prestaShopDeleteImages($bridge);
        break;
    }
  }

  /**
   * @param $bridge
   */
  private function _pinnacleDeleteImages(M1_Bridge $bridge)
  {
    $dirs = array(
      M1_STORE_BASE_DIR . $bridge->config->imagesDir . 'catalog/',
      M1_STORE_BASE_DIR . $bridge->config->imagesDir . 'manufacturers/',
      M1_STORE_BASE_DIR . $bridge->config->imagesDir . 'products/',
      M1_STORE_BASE_DIR . $bridge->config->imagesDir . 'products/thumbs/',
      M1_STORE_BASE_DIR . $bridge->config->imagesDir . 'products/secondary/',
      M1_STORE_BASE_DIR . $bridge->config->imagesDir . 'products/preview/',
    );

    $ok = true;

    foreach ($dirs as $dir) {

      if (!file_exists($dir)) {
        continue;
      }

      $dirHandle = opendir($dir);

      while (false !== ($file = readdir($dirHandle))) {
        if ($file != "." && $file != ".." && !preg_match("/^readme\.txt?$/",$file) && !preg_match("/\.bak$/i",$file)) {
          $file_path = $dir . $file;
          if( is_file($file_path) ) {
            if(!rename($file_path, $file_path.".bak")) $ok = false;
          }
        }
      }

      closedir($dirHandle);

    }

    if ($ok) print "OK";
    else print "ERROR";
  }

  /**
   * @param $bridge
   */
  private function _prestaShopDeleteImages(M1_Bridge $bridge)
  {
    $dirs = array(
      M1_STORE_BASE_DIR . $bridge->config->imagesDir . 'c/',
      M1_STORE_BASE_DIR . $bridge->config->imagesDir . 'p/',
      M1_STORE_BASE_DIR . $bridge->config->imagesDir . 'm/',
    );

    $ok = true;

    foreach ($dirs as $dir) {

      if (!file_exists($dir)) {
        continue;
      }

      $dirHandle = opendir($dir);

      while (false !== ($file = readdir($dirHandle))) {
        if ($file != "." && $file != ".." && preg_match("/(\d+).*\.jpg?$/", $file)) {
          $file_path = $dir . $file;
          if (is_file($file_path)) {
            if (!rename($file_path, $file_path . ".bak")) $ok = false;
          }
        }
      }

      closedir($dirHandle);

    }

    if ($ok) print "OK";
    else print "ERROR";
  }
}

/**
 * Class M1_Bridge_Action_Delete
 */
class M1_Bridge_Action_Delete
{

  const ERROR_NONE = 0;
  const ERROR_FILES_ARE_NOT_WRITABLE = 1;
  const ERROR_CUSTOM_FILES_DETECTED = 2;
  const ERROR_INTERNAL_ERROR = 3;

  private $_response = array(
    'code' => self::ERROR_NONE,
    'message' => '',
  );

  /**
   * @param int    $code Response Code
   * @param string $msg  Response Msg
   */
  private function _response($code, $msg)
  {
    $this->_response['code'] = $code;
    $this->_response['message'] = $msg;

    die(json_encode($this->_response));
  }

  /**
   * @param M1_Bridge $bridge
   */
  public function perform(M1_Bridge $bridge)
  {
    $allowedEntries = array(
      '.',
      '..',
      '.htaccess',
      'bridge.php',
      'config.php',
      'index.php',
    );

    $entriesToDelete = array(
      '.htaccess',
      'bridge.php',
      'config.php',
      'index.php',
    );

    $currentEntries = scandir(__DIR__);

    if ($diff = array_diff($currentEntries, $allowedEntries)) {
      $this->_response(
        self::ERROR_CUSTOM_FILES_DETECTED,
        'Unexpected files detected (' . implode(', ', $diff) . '). The bridge will not be removed. Please delete custom files first.'
      );
    }

    foreach ($entriesToDelete as $key => $entry) {
      if (!file_exists($entry)) {
        unset($entriesToDelete[$key]);
        continue;
      }

      if (!is_writable($entry)) {
        $this->_response(
          self::ERROR_FILES_ARE_NOT_WRITABLE,
          'Bridge is not deleted! File \'' . $entry . '\' is not writable. Please set write permission or delete files manually.'
        );
      }
    }

    try {
      foreach ($entriesToDelete as $entry) {
        unlink(__DIR__ . DIRECTORY_SEPARATOR . $entry);
      }

      rmdir(__DIR__);
    } catch (Exception $e) {
      $this->_response(self::ERROR_INTERNAL_ERROR, 'Bridge is not deleted! Internal error: ' . M1_Bridge::getBridgeErrorMessage($e, __FILE__));
    } catch (Throwable $e) {
      $this->_response(self::ERROR_INTERNAL_ERROR, 'Bridge is not deleted! Internal error: ' . M1_Bridge::getBridgeErrorMessage($e, __FILE__));
    }

    $this->_response(self::ERROR_NONE, 'Deleted successfully.');
  }

}

/**
 * Class M1_Bridge_Action_Cubecart
 */
class M1_Bridge_Action_Cubecart
{

  /**
   * @param M1_Bridge $bridge
   */
  public function perform(M1_Bridge $bridge)
  {
    $dirHandle = opendir(M1_STORE_BASE_DIR . 'language/');

    $languages = array();

    while ($dirEntry = readdir($dirHandle)) {
      if (!is_dir(M1_STORE_BASE_DIR . 'language/' . $dirEntry) || $dirEntry == '.'
        || $dirEntry == '..' || strpos($dirEntry, "_") !== false
      ) {
        continue;
      }

      $lang['id'] = $dirEntry;
      $lang['iso2'] = $dirEntry;

      $cnfile = "config.inc.php";

      if (!file_exists(M1_STORE_BASE_DIR . 'language/' . $dirEntry . '/'. $cnfile)) {
        $cnfile = "config.php";
      }

      if (!file_exists( M1_STORE_BASE_DIR . 'language/' . $dirEntry . '/'. $cnfile)) {
        continue;
      }

      $str = file_get_contents(M1_STORE_BASE_DIR . 'language/' . $dirEntry . '/'.$cnfile);
      preg_match("/".preg_quote('$langName')."[\s]*=[\s]*[\"\'](.*)[\"\'];/", $str, $match);

      if (isset($match[1])) {
        $lang['name'] = $match[1];
        $languages[] = $lang;
      }
    }

    echo serialize($languages);
  }
}

/**
 * Class M1_Bridge_Action_CreateRefund
 */
class M1_Bridge_Action_CreateRefund
{

  private $_m2objectManager = null;

  /**
   * @param stdClass $invoice Magento creditmemo object
   * @param array    $qtys    Array of item quantities ['order_item_id' => 'qty']
   * @return array
   */
  private function _adjustQuantitiesBeforeRefund($invoice, $qtys)
  {
    // fill missing quantities with zeros so they won't be fully refunded
    foreach ($invoice->getAllItems() as $item) {
      if (!isset($qtys[$item->getOrderItemId()])) {
        $qtys[$item->getOrderItemId()] = 0;
      }
    }
    return $qtys;
  }

  /**
   * @param stdClass $creditmemo Magento creditmemo object
   * @param array    $qtys       Array of item quantities ['order_item_id' => 'qty']
   * @return array
   */
  private function _adjustQuantitiesAfterRefund($creditmemo, $qtys)
  {
    // substract credit memo item quantities from quantity data
    // getItemByOrderId doesn't work at this point; use getAllItems instead
    foreach ($creditmemo->getAllItems() as $cmItem) {
      if (isset($qtys[$cmItem->getOrderItemId()])) {
        $qtys[$cmItem->getOrderItemId()] -= $cmItem->getQty();
        if ($qtys[$cmItem->getOrderItemId()] < 0) {
          // this can happen for a parent item of a variant
          // we don't need to pass quantity of a parent to createByInvoice; just reset it to 0
          $qtys[$cmItem->getOrderItemId()] = 0;
        }
      }
    }
    return $qtys;
  }

  /**
   * @param M1_Bridge $bridge
   * @return void
   */
  public function perform(M1_Bridge $bridge)
  {
    $response = array('error' => null, 'data' => null);

    $orderId = $_POST['order_id'];
    $isOnline = $_POST['is_online'];
    $refundMessage = isset($_POST['refund_message']) ? $_POST['refund_message'] : '';
    $itemsData = json_decode($_POST['items'], true);
    $totalRefund = isset($_POST['total_refund']) ? (float)$_POST['total_refund'] : null;
    $shippingRefund = isset($_POST['shipping_refund']) ? (float)$_POST['shipping_refund'] : null;
    $adjustmentRefund = isset($_POST['adjustment_refund']) ? (float)$_POST['adjustment_refund'] : null;
    $restockItems = isset($_POST['restock_items']) ? $_POST['restock_items'] : false;
    $sendNotifications = isset($_POST['send_notifications']) ? $_POST['send_notifications'] : false;

    try {

      switch ($bridge->config->cartType) {

        case 'Magento1212':

          $version = str_replace('EE.', '', $bridge->config->cartVars['dbVersion']);
          if (version_compare($version, '2.0.0', '<')) {
            require M1_STORE_ROOT_DIR . '/app/Mage.php';
            Mage::app();

            $order = Mage::getModel('sales/order')->load($orderId);
            $response['data']['order'] = $order->getIncrementId();

            $orderService = Mage::getModel('sales/service_order', $order);
            if ($restockItems) {
              $stock = Mage::getModel('cataloginventory/stock');
            } else {
              $stock = null;
            }

            $qtys = array();
            $processingFirstInvoice = true;
            foreach ($itemsData as $itemData) {
              $qtys[$itemData['order_product_id']] = isset($itemData['quantity']) ? (int)$itemData['quantity'] : 0;
            }

            $invoices = $order->getInvoiceCollection();
            foreach ($invoices as $invoice) {
              $response['data']['invoices'][] = $invoice->getIncrementId();

              if ($qtys && (array_sum($qtys) === 0) && (!$processingFirstInvoice || (($shippingRefund === 0) && ($adjustmentRefund === 0)))) {
                // if no items left for refund skip processing; collect invoice ids only
                continue;
              }

              if (($qtys || $adjustmentRefund) && ($shippingRefund === null)) {
                $shippingRefund = 0;
                // if refund items requested and shipment not requested, do not refund shipment explicitly
              }

              if ($qtys || $shippingRefund || $adjustmentRefund) {
                $qtys = $this->_adjustQuantitiesBeforeRefund($invoice, $qtys);
                // if its a partial refund we must pass all item quantities to Magento method; zero if item won't be refunded
              }

              $mageRefundData = array('qtys' => $qtys);
              if (($shippingRefund !== null) && $processingFirstInvoice) {
                $mageRefundData['shipping_amount'] = $shippingRefund;
              }

              if (($adjustmentRefund !== null) && $processingFirstInvoice) {
                if ($adjustmentRefund < 0) {
                  $mageRefundData['adjustment_negative'] = -$adjustmentRefund;
                } else {
                  $mageRefundData['adjustment_positive'] = $adjustmentRefund;
                }
              }

              $creditmemo = $orderService->prepareInvoiceCreditmemo($invoice, $mageRefundData);
              if (!($creditmemo->getSubtotal() || $creditmemo->getShippingAmount() || $creditmemo->getAdjustment())){
                // this invoice doesn't contain requested items; proceed to next one
                continue;
              }

              if (!empty($refundMessage)) { // empty string raises exception
                $creditmemo->addComment($refundMessage);
              }

              $creditmemo->setRefundRequested(true)
                ->setOfflineRequested(!$isOnline)
                ->register();
              Mage::getModel('core/resource_transaction')
                ->addObject($creditmemo)
                ->addObject($creditmemo->getOrder())
                ->addObject($creditmemo->getInvoice())
                ->save();

              if ($qtys) {
                $qtys = $this->_adjustQuantitiesAfterRefund($creditmemo, $qtys);
              }

              if ($stock) {
                foreach ($creditmemo->getAllItems() as $item) {
                  $stock->backItemQty($item->getProductId(), $item->getQty());
                }
              }

              if ($sendNotifications) {
                $creditmemo->sendEmail();
              }

              $response['data']['refunds'][] = $creditmemo->getIncrementId();

              $processingFirstInvoice = false;
              // second and following invoices never contain any shipping

            }
          } else {

            require M1_STORE_ROOT_DIR . '/app/bootstrap.php';
            $bootstrap = Magento\Framework\App\Bootstrap::create(M1_STORE_ROOT_DIR, $_SERVER);
            $this->_m2objectManager = $bootstrap->getObjectManager();

            $state = $this->_m2objectManager->get('\Magento\Framework\App\State');
            $state->setAreaCode('global');

            $orderRepository = $this->_m2objectManager->create('\Magento\Sales\Model\OrderRepository');
            $order = $orderRepository->get($orderId);

            $response['data']['order'] = $order->getIncrementId();

            $creditmemoService = $this->_m2objectManager->create('\Magento\Sales\Model\Service\CreditmemoService');
            $creditmemoFactory = $this->_m2objectManager->create('\Magento\Sales\Model\Order\CreditmemoFactory');
            $creditmemoRepository = $this->_m2objectManager->create('\Magento\Sales\Model\Order\CreditmemoRepository');

            if ($sendNotifications) {
              $creditmemoSender = $this->_m2objectManager->create('Magento\Sales\Model\Order\Email\Sender\CreditmemoSender');
            } else {
              $creditmemoSender = null;
            }

            $qtys = array();
            foreach ($itemsData as $itemData) {
              $qtys[$itemData['order_product_id']] = isset($itemData['quantity']) ? (int)$itemData['quantity'] : 0;
            }

            $invoices = $order->getInvoiceCollection();
            $processingFirstInvoice = true;
            foreach ($invoices as $invoice) {
              $response['data']['invoices'][] = $invoice->getIncrementId();

              if ($qtys && (array_sum($qtys) === 0) && (!$processingFirstInvoice || (($shippingRefund === 0) && ($adjustmentRefund === 0)))) {
                // if no items left for refund skip processing; collect invoice ids only
                continue;
              }

              if (($qtys || $adjustmentRefund) && ($shippingRefund === null)) {
                $shippingRefund = 0;
                // if refund items requested and shipment not requested, do not refund shipment explicitly
              }

              if ($qtys || $shippingRefund || $adjustmentRefund) {
                $qtys = $this->_adjustQuantitiesBeforeRefund($invoice, $qtys);
                // if its a partial refund we must pass all item quantities to Magento method; zero if item won't be refunded
              }

              $mageRefundData = array('qtys' => $qtys);
              if (($shippingRefund !== null) && $processingFirstInvoice) {
                $mageRefundData['shipping_amount'] = $shippingRefund;
              }

              if (($adjustmentRefund !== null) && $processingFirstInvoice) {
                if ($adjustmentRefund < 0) {
                  $mageRefundData['adjustment_negative'] = -$adjustmentRefund;
                } else {
                  $mageRefundData['adjustment_positive'] = $adjustmentRefund;
                }
              }

              $creditmemo = $creditmemoFactory->createByInvoice($invoice, $mageRefundData);
              if (!($creditmemo->getSubtotal() || $creditmemo->getShippingAmount() || $creditmemo->getAdjustment())){
                // this invoice doesn't contain requested items; proceed to next one
                continue;
              }

              if (!empty($refundMessage)) { // empty string raises exception
                $creditmemo->addComment($refundMessage);
              }

              foreach ($creditmemo->getAllItems() as $creditmemoItem) {
                $creditmemoItem->setBackToStock($restockItems);
              }

              $creditmemoService->refund($creditmemo, !$isOnline);
              $creditmemoRepository->save($creditmemo);

              if ($qtys) {
                $qtys = $this->_adjustQuantitiesAfterRefund($creditmemo, $qtys);
              }

              if ($sendNotifications) {
                $creditmemoSender->send($creditmemo);
              }

              $response['data']['refunds'][] = $creditmemo->getIncrementId();

              $processingFirstInvoice = false;
              // second and following invoices never contain any shipping

            }

            $orderRepository->save($order);
          }

          break;

        case 'Wordpress':
          if ($bridge->config->cartId === 'Woocommerce') {
            chdir(M1_STORE_BASE_DIR . '/wp-admin');
            require_once M1_STORE_BASE_DIR . '/wp-load.php';

            $order = wc_get_order($orderId);

            if ($isOnline) {
              if (WC()->payment_gateways()) {
                $paymentGateways = WC()->payment_gateways->payment_gateways();
              }

              if (!(isset($paymentGateways[$order->payment_method]) && $paymentGateways[$order->payment_method]->supports('refunds'))) {
                throw new Exception('Order payment method does not support refunds');
              }
            }

            $refund = wc_create_refund(array(
              'amount' => !is_null($totalRefund) ? (float)$totalRefund : $order->get_remaining_refund_amount(),
              'reason' => $refundMessage,
              'order_id' => $orderId,
              'line_items' => $itemsData,
              'refund_payment' => false, // dont repay refund immediately for better error processing
              'restock_items' => $restockItems
            ));

            if (is_wp_error($refund)) {
              $response['error']['code'] = $refund->get_error_code();
              $response['error']['message'] = $refund->get_error_message();
            } elseif (!$refund) {
              $response['error']['message'] = 'An error occurred while attempting to create the refund';
            }

            if ($response['error']) {
              echo json_encode($response);
              return;
            }

            if ($isOnline) {

              if (WC()->payment_gateways()) {
                $paymentGateways = WC()->payment_gateways->payment_gateways();
              }

              if (isset($paymentGateways[$order->payment_method])
                && $paymentGateways[$order->payment_method]->supports('refunds')
              ) {
                try {
                  $result = $paymentGateways[$order->payment_method]->process_refund($orderId,
                    $refund->get_refund_amount(), $refund->get_refund_reason());
                } catch (Exception $e) {
                  $refund->delete(true); // delete($force_delete = true)
                  throw $e;
                }
                if (is_wp_error($result)) {
                  $refund->delete(true);
                  $response['error']['code'] = $result->get_error_code();
                  $response['error']['message'] = $result->get_error_message();
                } elseif (!$result) {
                  $refund->delete(true);
                  $response['error']['message'] = 'An error occurred while attempting to repay the refund using the payment gateway API';
                } else {
                  $response['data']['refunds'][] = $refund->get_id();
                }
              } else {
                $refund->delete(true);
                $response['error']['message'] = 'Order payment method does not support refunds';
              }
            }

          } else {
            $response['error']['message'] = 'Action is not supported';
          }

          break;

        default:
          $response['error']['message'] = 'Action is not supported';
      }

    } catch (Exception $e) {
      unset($response['data']);
      $response['error'] = M1_Bridge::getBridgeError($e, null, null, 'message', 'code', __FILE__);
    }

    echo json_encode($response);

  }

}

/**
 * Class M1_Bridge_Action_Collect_Totals
 */
class M1_Bridge_Action_Collect_Totals
{

  /**
   * @param M1_Bridge $bridge
   */
  public function perform(M1_Bridge $bridge)
  {
    $responce = array(
      'error' => false,
      'code' => null,
      'message' => null,
    );

    try {
      switch ($_POST['cartId']) {
        case 'Magento1212' :
          if (!file_exists(M1_STORE_ROOT_DIR . '/app/etc/env.php')) {

            include_once M1_STORE_ROOT_DIR . 'includes/config.php';
            include_once M1_STORE_ROOT_DIR . 'app/bootstrap.php';
            include_once M1_STORE_ROOT_DIR . 'app/Mage.php';
            Mage::init();

            $quote = Mage::getModel('sales/quote');
            $quote->loadActive($_POST['basketId']);
            $quote->getShippingAddress();
            $quote->collectTotals()->save();

            echo json_encode($responce);
            break;
          } else {
            include_once M1_STORE_ROOT_DIR . 'app/bootstrap.php';

            $bootstrap = Magento\Framework\App\Bootstrap::create(M1_STORE_ROOT_DIR, $_SERVER);
            $obj = $bootstrap->getObjectManager();

            $state = $obj->get('Magento\Framework\App\State');
            $state->setAreaCode('frontend');

            $quote = $obj->get('Magento\Quote\Model\Quote');
            $quote->loadActive($_POST['basketId']);
            $quote->getShippingAddress();
            $quote->collectTotals()->save();

            echo json_encode($responce);
            break;
          }
      }
    } catch (Exception $e) {
      $error = M1_Bridge::getBridgeError($e, null, null, 'message', 'code', __FILE__);
      $responce['error'] = true;
      $responce['code'] = $error['code'];
      $responce['message'] = $error['message'];
      echo json_encode($responce);
    }
  }
}

/**
 * Class M1_Bridge_Action_Clearcache
 */
class M1_Bridge_Action_Clearcache
{

  /**
   * @param M1_Bridge $bridge
   */
  public function perform(M1_Bridge $bridge)
  {
    switch($bridge->config->cartType) {
      case "Cubecart":
        $this->_CubecartClearCache();
        break;
      case "Prestashop11":
        $this->_PrestashopClearCache();
        break;
      case "Opencart14" :
        $this->_OpencartClearCache();
        break;
      case "XtcommerceVeyton" :
        $this->_Xtcommerce4ClearCache();
        break;
      case "Ubercart" :
        $this->_ubercartClearCache();
        break;
      case "Tomatocart" :
        $this->_tomatocartClearCache();
        break;
      case "Virtuemart113" :
        $this->_virtuemartClearCache();
        break;
      case "Magento1212" :
        $this->_magentoClearCache($bridge);
        break;
      case "Oscommerce3":
        $this->_Oscommerce3ClearCache();
        break;
      case "Oxid":
        $this->_OxidClearCache();
        break;
      case "XCart":
        $this->_XcartClearCache();
        break;
      case "Cscart203":
        $this->_CscartClearCache();
        break;
      case "Prestashop15":
        $this->_Prestashop15ClearCache();
        break;
      case "Gambio":
        $this->_GambioClearCache();
        break;
      case "Shopware":
        $this->_Shopware6ClearCashe($bridge);
        break;
    }
  }

  /**
   * @param array  $dirs
   * @param string $fileExclude - name file in format pregmatch
   * @return bool
   */
  private function _removeGarbage($dirs = array(), $fileExclude = '')
  {
    $result = true;

    foreach ($dirs as $dir) {

      if (!file_exists($dir)) {
        continue;
      }

      $dirHandle = opendir($dir);

      while (false !== ($file = readdir($dirHandle))) {
        if ($file == "." || $file == "..") {
          continue;
        }

        if ((trim($fileExclude) != '') && preg_match("/^" .$fileExclude . "?$/", $file)) {
          continue;
        }

        if (is_dir($dir . $file)) {
          continue;
        }

        if (!unlink($dir . $file)) {
          $result = false;
        }
      }

      closedir($dirHandle);
    }

    if ($result) {
      echo 'OK';
    } else {
      echo 'ERROR';
    }

    return $result;
  }

  private function _magentoClearCache(M1_Bridge $bridge)
  {
    $response = array('error' => null, 'data' => false);
    switch ($bridge->config->cartType) {
      case 'Magento1212':

        try {
          $version = str_replace('EE.', '', $bridge->config->cartVars['dbVersion']);

          if (version_compare($version, '2.0.0', '>=')) {
            $_SERVER['REQUEST_URI'] = '';
            require M1_STORE_ROOT_DIR . 'app' . DIRECTORY_SEPARATOR . 'bootstrap.php';

            $bootstrap = Magento\Framework\App\Bootstrap::create(rtrim(M1_STORE_ROOT_DIR, DIRECTORY_SEPARATOR), $_SERVER);
            $objectManager = $bootstrap->getObjectManager();

            if (isset($_POST['product_ids'])) {
              $context = $objectManager->get('\Magento\Framework\Indexer\CacheContext');
              $eventManager = $objectManager->get('\Magento\Framework\Event\ManagerInterface');

              if (is_array($_POST['product_ids'])) {
                $params = $_POST['product_ids'];
              } else {
                $params = [$_POST['product_ids']];
              }

              $context->registerEntities(\Magento\Catalog\Model\Product::CACHE_TAG, $params);
              $eventManager->dispatch('clean_cache_by_tags', array('object' => $context));

            } elseif (isset($_POST['cache_type'])) {

              $cacheTypeList = $objectManager->create('Magento\Framework\App\Cache\TypeListInterface');
              $cacheFrontendPool = $objectManager->create('Magento\Framework\App\Cache\Frontend\Pool');
              $types = is_array($_POST['cache_type']) ? $_POST['cache_type'] : array($_POST['cache_type']);

              foreach ($types as $type) {
                $cacheTypeList->cleanType($type);
              }

              foreach ($cacheFrontendPool as $cacheFrontend) {
                $cacheFrontend->getBackend()->clean();
              }
            }
          } else {

            if (isset($_POST['product_ids'])) {
              //todo clear cache per product

            } elseif (isset($_POST['cache_type'])) {

              require_once M1_STORE_ROOT_DIR . 'app' . DIRECTORY_SEPARATOR . 'Mage.php';
              Mage::app('admin');
              umask(0);

              $types = is_array($_POST['cache_type']) ? $_POST['cache_type'] : array($_POST['cache_type']);
              foreach ($types as $type) {
                Mage::app()->getCacheInstance()->cleanType($type);
                Mage::dispatchEvent('adminhtml_cache_refresh_type', array('type' => $type));
              }
            }
          }

          $response['data'] = true;

        } catch (Exception $e) {
          $response['error'] = M1_Bridge::getBridgeError($e, null, null, 'message', 'code', __FILE__);
        }

        break;

      default:
        $response['error']['message'] = 'Action is not supported';
    }

    echo json_encode($response);
  }

  private function _CubecartClearCache()
  {
    $ok = true;

    if (file_exists(M1_STORE_BASE_DIR . 'cache')) {
      $dirHandle = opendir(M1_STORE_BASE_DIR . 'cache/');

      while (false !== ($file = readdir($dirHandle))) {
        if ($file != "." && $file != ".." && !preg_match("/^index\.html?$/", $file) && !preg_match("/^\.htaccess?$/", $file)) {
          if (is_file( M1_STORE_BASE_DIR . 'cache/' . $file)) {
            if (!unlink(M1_STORE_BASE_DIR . 'cache/' . $file)) {
              $ok = false;
            }
          }
        }
      }

      closedir($dirHandle);
    }

    if (file_exists(M1_STORE_BASE_DIR.'includes/extra/admin_cat_cache.txt')) {
      unlink(M1_STORE_BASE_DIR.'includes/extra/admin_cat_cache.txt');
    }

    if ($ok) {
      echo 'OK';
    } else {
      echo 'ERROR';
    }
  }

  private function _PrestashopClearCache()
  {
    $dirs = array(
      M1_STORE_BASE_DIR . 'tools/smarty/compile/',
      M1_STORE_BASE_DIR . 'tools/smarty/cache/',
      M1_STORE_BASE_DIR . 'img/tmp/'
    );

    $this->_removeGarbage($dirs, 'index\.php');
  }

  private function _OpencartClearCache()
  {
    $dirs = array(
      M1_STORE_BASE_DIR . 'system/cache/',
    );

    $this->_removeGarbage($dirs, 'index\.html');
  }

  private function _Xtcommerce4ClearCache()
  {
    $dirs = array(
      M1_STORE_BASE_DIR . 'cache/',
    );

    $this->_removeGarbage($dirs, 'index\.html');
  }

  private function _ubercartClearCache()
  {
    $dirs = array(
      M1_STORE_BASE_DIR . 'sites/default/files/imagecache/product/',
      M1_STORE_BASE_DIR . 'sites/default/files/imagecache/product_full/',
      M1_STORE_BASE_DIR . 'sites/default/files/imagecache/product_list/',
      M1_STORE_BASE_DIR . 'sites/default/files/imagecache/uc_category/',
      M1_STORE_BASE_DIR . 'sites/default/files/imagecache/uc_thumbnail/',
    );

    $this->_removeGarbage($dirs);
  }

  private function _tomatocartClearCache()
  {
    $dirs = array(
      M1_STORE_BASE_DIR . 'includes/work/',
    );

    $this->_removeGarbage($dirs, '\.htaccess');
  }

  /**
   * Try chage permissions actually :)
   */
  private function _virtuemartClearCache()
  {
    $pathToImages = 'components/com_virtuemart/shop_image';

    $dirParts = explode("/", $pathToImages);
    $path = M1_STORE_BASE_DIR;
    foreach ($dirParts as $item) {
      if ($item == '') {
        continue;
      }

      $path .= $item . DIRECTORY_SEPARATOR;
    }
  }

  private function _Oscommerce3ClearCache()
  {
    $dirs = array(
      M1_STORE_BASE_DIR . 'osCommerce/OM/Work/Cache/',
    );

    $this->_removeGarbage($dirs, '\.htaccess');
  }

  private function _GambioClearCache()
  {
    $dirs = array(
      M1_STORE_BASE_DIR . 'cache/',
    );

    $this->_removeGarbage($dirs, 'index\.html');
  }

  private function _OxidClearCache()
  {
    $dirs = array(
      M1_STORE_BASE_DIR . 'tmp/',
    );

    $this->_removeGarbage($dirs, '\.htaccess');
  }

  private function _XcartClearCache()
  {
    $dirs = array(
      M1_STORE_BASE_DIR . 'var/cache/',
    );

    $this->_removeGarbage($dirs, '\.htaccess');
  }

  private function _CscartClearCache()
  {
    $dir = M1_STORE_BASE_DIR . 'var/cache/';
    $res = $this->removeDirRec($dir);

    if ($res) {
      echo 'OK';
    } else {
      echo 'ERROR';
    }
  }

  private function _Prestashop15ClearCache()
  {
    $dirs = array(
      M1_STORE_BASE_DIR . 'cache/smarty/compile/',
      M1_STORE_BASE_DIR . 'cache/smarty/cache/',
      M1_STORE_BASE_DIR . 'img/tmp/'
    );

    $this->_removeGarbage($dirs, 'index\.php');
  }

  private function _Shopware6ClearCashe(M1_Bridge $bridge)
  {
    $shopwareVersion = $bridge->config->cartVars['dbVersion'];
    $response = array('error' => null, 'data' => false);

    if (version_compare($shopwareVersion, '6.0.0.0', '>=')) {
      try {
        if (file_exists(M1_STORE_BASE_DIR . '.env')) {
          (new \Symfony\Component\Dotenv\Dotenv(true))->load(M1_STORE_BASE_DIR . '.env');
          $storeRoot = M1_STORE_BASE_DIR;
        } elseif(file_exists(M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR . '.env')) {
          (new \Symfony\Component\Dotenv\Dotenv(true))->load(M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR . '.env');
          $storeRoot = M1_STORE_BASE_DIR . '..' . DIRECTORY_SEPARATOR;
        } else {
          throw new \Exception('File \'.env\' not found');
        }

        $adapter = new M1_Config_Adapter_Shopware();

        require_once $storeRoot . 'vendor/autoload.php';

        if (isset($_POST['cache_type']['user_id'])) {
          $userId = $_POST['cache_type']['user_id'];
        } else {
          $response['error']['message'] = 'UserId not defined';
          $response['error']['code']    = 1;
        }

        $data = ['payload' => [], 'method' => 'DELETE', 'entity' => '_action/cache', 'meta' => ['user_id' => $userId]];
        $response['data'] = $adapter->apiSend($data);
      } catch (\Exception $e) {
        $response['error'] = M1_Bridge::getBridgeError($e, null, null, 'message', 'code', __FILE__);
      }
    }

    echo json_encode($response);
  }

  /**
   * @param $dir
   * @return bool
   */
  private function removeDirRec($dir)
  {
    $result = true;

    if ($objs = glob($dir."/*")) {
      foreach ($objs as $obj) {
        if (is_dir($obj)) {
          //print "IS DIR! START RECURSIVE FUNCTION.\n";
          $this->removeDirRec($obj);
        } else {
          if (!unlink($obj)) {
            //print "!UNLINK FILE: ".$obj."\n";
            $result = false;
          }
        }
      }
    }
    if (!rmdir($dir)) {
      //print "ERROR REMOVE DIR: ".$dir."\n";
      $result = false;
    }

    return $result;
  }
}

/**
 * Class M1_Bridge_Action_Batchsavefile
 */
class M1_Bridge_Action_Batchsavefile extends M1_Bridge_Action_Savefile
{

  /**
   * @param M1_Bridge $bridge
   */
  public function perform(M1_Bridge $bridge)
  {
    $result = array();

    foreach ($_POST['files'] as $fileInfo) {
      $result[$fileInfo['id']] = $this->_saveFile(
        $fileInfo['source'],
        $fileInfo['target'],
        (int)$fileInfo['width'],
        (int)$fileInfo['height']
      );
    }

    echo serialize($result);
  }

}

/**
 * Class M1_Bridge_Action_Basedirfs
 */
class M1_Bridge_Action_Basedirfs
{

  /**
   * @param M1_Bridge $bridge
   */
  public function perform(M1_Bridge $bridge)
  {
    echo M1_STORE_BASE_DIR;
  }
}


define('M1_BRIDGE_VERSION', '203');
define('M1_BRIDGE_DOWNLOAD_LINK', 'https://api.veeqo.api2cart.com/v1.0/bridge.download.file?update');
define('M1_BRIDGE_DIRECTORY_NAME', basename(getcwd()));
define('M1_BRIDGE_PUBLIC_KEY', '-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqcPRXKb4kdNjopk/iPiV
z/OeNM122bqvy9cfp+Nu2Hk/c8PgFvlNqxCmYUPVdep3slWBkUpJbYsJi1u5NzS6
Zq74al6b3IbyElVIpC8guUJfg66AbUy8VqS2VjQja3klcGinDiy26FxS+fnRZjx/
lQKqGRnRMbsp3GhtUulmo5/L8fMoQK3ZCRqTidoZHWOCtPp4rl4+ttqgUk6DtVuy
nXm/IURoC2wEtq8PEsiIfi+2SkTGe7nK0La/KGrf1v92jipMJNrtQjvyMX4YBmNf
QnNHR1w25km031qNKTrbjuaxIMF0gwDVVik2d/gDWpLXhxOugU6eDyTDsNAVgrmb
MQIDAQAB
-----END PUBLIC KEY-----
');
define('M1_BRIDGE_PUBLIC_KEY_ID', '6d6dc09be3763bc1e7c418b29bb4ce76');
define('M1_BRIDGE_ENABLE_ENCRYPTION', extension_loaded('openssl'));

show_error(0);

require_once 'config.php';

if (!defined('M1_TOKEN')) {
  die('ERROR_TOKEN_NOT_DEFINED');
}

if (strlen(M1_TOKEN) !== 32) {
  die('ERROR_TOKEN_LENGTH');
}

function show_error($status)
{
  if ($status) {
    @ini_set('display_errors', 1);
    if (substr(phpversion(), 0, 1) >= 5) {
      $errorLevel = E_ALL;

      if (PHP_VERSION_ID < 80000) {
        $errorLevel &= ~E_STRICT;
      }

      error_reporting($errorLevel);
    } else {
      error_reporting(E_ALL);
    }
  } else {
    @ini_set('display_errors', 0);
    error_reporting(0);
  }
}

/**
 * @param $array
 * @return array|string|stripslashes_array
 */
function stripslashes_array($array)
{
  return is_array($array) ? array_map('stripslashes_array', $array) : stripslashes($array);
}

function exceptions_error_handler($severity, $message, $filename, $lineno) {
  if (error_reporting() === 0) {
    return;
  }

  if (strpos($message, 'Declaration of') === 0) {
    return;
  }

  if ($severity === E_DEPRECATED) {
    return;
  }

  if (error_reporting() & $severity) {
    throw new ErrorException($message, 0, $severity, $filename, $lineno);
  }
}

set_error_handler('exceptions_error_handler');

/**
 * @return bool|mixed|string
 */
function getPHPExecutable()
{
  $paths = explode(PATH_SEPARATOR, getenv('PATH'));
  $paths[] = PHP_BINDIR;
  foreach ($paths as $path) {
    // we need this for XAMPP (Windows)
    if (isset($_SERVER["WINDIR"]) && strstr($path, 'php.exe') && file_exists($path) && is_file($path)) {
      return $path;
    } else {
      $phpExecutable = $path . DIRECTORY_SEPARATOR . "php" . (isset($_SERVER["WINDIR"]) ? ".exe" : "");
      if (file_exists($phpExecutable) && is_file($phpExecutable)) {
        return $phpExecutable;
      }
    }
  }
  return false;
}

function swapLetters($input) {
  $default = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  $custom  = "ZYXWVUTSRQPONMLKJIHGFEDCBAzyxwvutsrqponmlkjihgfedcba9876543210+/";

  return strtr($input, $default, $custom);
}

/**
 * @param string $data Data to encrypt
 *
 * @return string
 */
function encrypt($data) {
  if (defined('M1_BRIDGE_PUBLIC_KEY') && defined('M1_BRIDGE_ENABLE_ENCRYPTION') && M1_BRIDGE_ENABLE_ENCRYPTION == 1) {
    if (function_exists('random_bytes')) {
      $aesKey = random_bytes(32);
      $iv     = random_bytes(16);
    } else {
      $aesKey = openssl_random_pseudo_bytes(32);
      $iv     = openssl_random_pseudo_bytes(16);
    }

    if (!openssl_public_encrypt($aesKey, $encryptedKey, M1_BRIDGE_PUBLIC_KEY, OPENSSL_PKCS1_OAEP_PADDING)) {
      die('ERROR_ENCRYPT');
    }

    $encryptedData = openssl_encrypt(gzcompress($data), 'aes-256-cbc', $aesKey, OPENSSL_RAW_DATA, $iv);

    return json_encode([
      'encryptedKey' => base64_encode($encryptedKey),
      'iv'           => base64_encode($iv),
      'data'         => base64_encode($encryptedData)
    ]);
  } else {
    return base64_encode($data);
  }
}

/**
 * @param string $data Data to decrypt
 *
 * @return false|mixed|string
 */
function decrypt($data) {
  if (defined('M1_BRIDGE_PUBLIC_KEY') && defined('M1_BRIDGE_ENABLE_ENCRYPTION') && M1_BRIDGE_ENABLE_ENCRYPTION == 1) {
    $payload = @json_decode( $data, true );

    if (json_last_error() !== JSON_ERROR_NONE || !isset($payload['encryptedKey'], $payload['iv'])) {
      die('ERROR_PARSE_DECRYPT');
    }

    $encryptedKey = base64_decode($payload['encryptedKey']);
    $iv           = base64_decode($payload['iv']);
    $aesData      = base64_decode(isset($payload['data']) ? $payload['data'] : '');

    openssl_public_decrypt($encryptedKey, $aesKey, M1_BRIDGE_PUBLIC_KEY);
    $result = openssl_decrypt($aesData, 'aes-256-cbc', $aesKey, OPENSSL_RAW_DATA, $iv);

    if ($result === false) {
      die('ERROR_DECRYPT');
    }

    return gzuncompress($result);
  } else {
    return $data;
  }
}

if (version_compare(phpversion(), '7.4', '<') && get_magic_quotes_gpc()) {
  $_COOKIE  = stripslashes_array($_COOKIE);
  $_FILES   = stripslashes_array($_FILES);
  $_GET     = stripslashes_array($_GET);
  $_POST    = stripslashes_array($_POST);
  $_REQUEST = stripslashes_array($_REQUEST);
}

if (isset($_POST['store_root'])) {
  if (empty($_POST['store_root'])) {
    die('ERROR_INVALID_STORE_ROOT');
  }

  $path = preg_replace('/\\' . DIRECTORY_SEPARATOR . '+/', DIRECTORY_SEPARATOR, $_POST['store_root']);
  $absPath = realpath($path);

  if (is_link($path) && strpos(realpath(dirname(__FILE__)), $absPath) === 0) {
    //bridge is contained in store's root or subdirectories
    define("M1_STORE_BASE_DIR", $absPath . DIRECTORY_SEPARATOR);
  } elseif ($_POST['store_root'] === $absPath) {
    define("M1_STORE_BASE_DIR", $_POST['store_root'] . DIRECTORY_SEPARATOR);
  } else {
    die('ERROR_INVALID_STORE_ROOT');
  }
} else {
  define("M1_STORE_BASE_DIR", realpath(dirname(__FILE__) . DIRECTORY_SEPARATOR . '..') . DIRECTORY_SEPARATOR);
}

$adapter = new M1_Config_Adapter();
$bridge = new M1_Bridge($adapter->create());

if (!$bridge->getLink()) {
  die ('ERROR_BRIDGE_CANT_CONNECT_DB');
}

$bridge->run();
?>